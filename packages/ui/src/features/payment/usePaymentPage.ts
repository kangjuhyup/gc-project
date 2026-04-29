import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { queryKeys } from '@/lib/queryKeys';
import {
  createPaymentIdempotencyKey,
  mapPaymentMethodToProvider,
  requestPayment,
  type PaymentMethod,
} from './paymentApi';
import { isPaymentRouteState, type PaymentRouteState } from './paymentSummary';

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
  const seatSelectionPath = `/movies/${movieId ?? '1'}/screenings/${screeningId ?? ''}/seats`;

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
