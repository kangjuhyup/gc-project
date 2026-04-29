import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { queryKeys } from '@/lib/queryKeys';
import { cancelReservation, fetchReservations } from './reservationApi';
import {
  DEFAULT_RESERVATION_CANCEL_REASON,
  filterReservations,
  type ReservationView,
} from './reservationFilters';

export function useReservationsPage() {
  const { member } = useAuth();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<ReservationView>('UPCOMING');
  const [cancelErrorReservationId, setCancelErrorReservationId] = useState<number | undefined>();
  const reservationsQuery = useQuery({
    enabled: Boolean(member?.id),
    queryKey: member?.id ? queryKeys.reservations.list(member.id) : queryKeys.reservations.all,
    queryFn: () => fetchReservations(member?.id ?? 0),
  });
  const cancelReservationMutation = useMutation({
    mutationFn: (reservationId: number) =>
      cancelReservation(reservationId, { reason: DEFAULT_RESERVATION_CANCEL_REASON }),
    onMutate: () => {
      setCancelErrorReservationId(undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
    onError: (_error, reservationId) => {
      setCancelErrorReservationId(reservationId);
    },
  });
  const reservations = reservationsQuery.data?.items ?? [];
  const filteredReservations = useMemo(
    () => filterReservations(reservations, currentView),
    [currentView, reservations],
  );

  const handleCancelReservation = (reservationId: number) => {
    cancelReservationMutation.mutate(reservationId);
  };

  return {
    cancelErrorReservationId,
    cancelReservationMutation,
    currentView,
    filteredReservations,
    handleCancelReservation,
    reservationsQuery,
    setCurrentView,
  };
}
