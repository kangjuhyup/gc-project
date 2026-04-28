import { useMutation } from '@tanstack/react-query';
import { createReservationPayment } from './paymentApi';

export function useCreateReservationPayment() {
  return useMutation({
    mutationFn: createReservationPayment,
  });
}
