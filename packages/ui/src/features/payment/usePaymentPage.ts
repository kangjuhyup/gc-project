import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ChangeEvent } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { queryKeys } from '@/lib/queryKeys';
import { createReservationPayment, type PaymentMethod } from './paymentApi';
import { isPaymentRouteState } from './paymentSummary';

export function usePaymentPage() {
  const location = useLocation();
  const { movieId, screeningId } = useParams();
  const queryClient = useQueryClient();
  const paymentState = isPaymentRouteState(location.state) ? location.state : null;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const paymentMutation = useMutation({
    mutationFn: createReservationPayment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
  const seatSelectionPath = `/movies/${movieId ?? '1'}/screenings/${screeningId ?? ''}/seats`;

  const handleSubmit = async () => {
    if (!paymentState || !agreedToTerms) {
      return;
    }

    await paymentMutation.mutateAsync({
      screeningId: paymentState.screeningId,
      seatIds: paymentState.seats.map((seat) => seat.id),
      paymentMethod,
      totalPrice: paymentState.totalPrice,
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
