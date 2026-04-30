import { useMutation, useQueries, useQueryClient, type Query } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { queryKeys } from '@/lib/queryKeys';
import {
  createPaymentIdempotencyKey,
  fetchPayment,
  mapPaymentMethodToProvider,
  requestPayment,
  type PaymentMethod,
  type PaymentResultDto,
} from './paymentApi';
import { isPaymentRouteState, type PaymentRouteState } from './paymentSummary';

const PAYMENT_CONFIRMATION_POLLING_INTERVAL_MS = 5_000;

export function usePaymentPage() {
  const location = useLocation();
  const { movieId, screeningId } = useParams();
  const queryClient = useQueryClient();
  const paymentState = isPaymentRouteState(location.state) ? location.state : null;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const paymentMutation = useMutation({
    mutationFn: requestPayments,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
  const requestedPayments = paymentMutation.data ?? [];
  const paymentConfirmationQueries = useQueries({
    queries: requestedPayments.map((payment) => ({
      enabled: Boolean(payment.paymentId),
      queryKey: queryKeys.payments.detail(payment.paymentId),
      queryFn: () => fetchPayment(payment.paymentId),
      refetchInterval: getPaymentConfirmationRefetchInterval(payment),
    })),
  });
  const paymentConfirmationDetails = useMemo(
    () =>
      requestedPayments.map(
        (payment, index) => paymentConfirmationQueries[index]?.data ?? payment,
      ),
    [paymentConfirmationQueries, requestedPayments],
  );
  const paymentConfirmationState = useMemo(
    () => summarizePaymentConfirmation(
      paymentConfirmationDetails,
      paymentConfirmationQueries.some((query) => query.isFetching),
    ),
    [paymentConfirmationDetails, paymentConfirmationQueries],
  );
  const isPaymentApproved = paymentConfirmationDetails.length > 0 &&
    paymentConfirmationDetails.every((payment) => payment.status === 'APPROVED');
  const seatSelectionPath = `/movies/${movieId ?? '1'}/screenings/${screeningId ?? ''}/seats`;

  useEffect(() => {
    if (isPaymentApproved) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    }
  }, [isPaymentApproved, queryClient]);

  const handleSubmit = async () => {
    if (!paymentState || !agreedToTerms) {
      return;
    }

    await paymentMutation.mutateAsync({
      paymentMethod,
      paymentState,
    });
  };

  const handleAgreementChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAgreedToTerms(event.target.checked);
  };

  return {
    agreedToTerms,
    handleAgreementChange,
    handleSubmit,
    paymentMethod,
    paymentMutation,
    paymentConfirmationState,
    paymentState,
    seatSelectionPath,
    setPaymentMethod,
  };
}

async function requestPayments({
  paymentMethod,
  paymentState,
}: {
  paymentMethod: PaymentMethod;
  paymentState: PaymentRouteState;
}) {
  const provider = mapPaymentMethodToProvider(paymentMethod);
  const amount = Math.round(paymentState.totalPrice / paymentState.seatHoldIds.length);

  return Promise.all(
    paymentState.seatHoldIds.map((seatHoldId) =>
      requestPayment({
        seatHoldId,
        idempotencyKey: createPaymentIdempotencyKey(seatHoldId),
        provider,
        amount,
      }),
    ),
  );
}

function getPaymentConfirmationRefetchInterval(payment: PaymentResultDto) {
  return (query: Query<PaymentResultDto>) =>
    isPaymentConfirmationPending(query.state.data?.status ?? payment.status)
      ? PAYMENT_CONFIRMATION_POLLING_INTERVAL_MS
      : false;
}

function isPaymentConfirmationPending(status: PaymentResultDto['status']) {
  return status === 'PENDING' || status === 'APPROVING';
}

function summarizePaymentConfirmation(payments: PaymentResultDto[], isFetching: boolean) {
  if (payments.length === 0) {
    return undefined;
  }

  if (payments.every((payment) => payment.status === 'APPROVED')) {
    return {
      label: '결제 승인 완료',
      description: '예매가 확정되었습니다.',
      status: 'success' as const,
    };
  }

  if (
    payments.some(
      (payment) => payment.status !== 'APPROVED' && !isPaymentConfirmationPending(payment.status),
    )
  ) {
    return {
      label: '결제 확인 실패',
      description: '결제 상태를 확인한 뒤 다시 시도해 주세요.',
      status: 'error' as const,
    };
  }

  return {
    label: '결제 확인 중',
    description: isFetching
      ? '결제 상태를 확인하고 있습니다.'
      : '5초마다 결제 상태를 다시 확인합니다.',
    status: 'pending' as const,
  };
}
