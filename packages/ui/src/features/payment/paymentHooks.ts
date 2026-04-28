import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { createReservationPayment } from './paymentApi';

export function useCreateReservationPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReservationPayment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
}
