import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [cancelErrorReservationId, setCancelErrorReservationId] = useState<string | undefined>();
  const reservationsQuery = useInfiniteQuery({
    enabled: Boolean(member?.id),
    initialPageParam: undefined as string | undefined,
    queryKey: queryKeys.reservations.list(),
    queryFn: ({ pageParam }) => fetchReservations({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const cancelReservationMutation = useMutation({
    mutationFn: (reservationId: string) =>
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
  const reservations = reservationsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const filteredReservations = useMemo(
    () => filterReservations(reservations, currentView),
    [currentView, reservations],
  );

  const handleCancelReservation = (reservationId: string) => {
    cancelReservationMutation.mutate(reservationId);
  };

  const handleFetchNextPage = () => {
    void reservationsQuery.fetchNextPage();
  };

  return {
    cancelErrorReservationId,
    cancelReservationMutation,
    currentView,
    filteredReservations,
    handleCancelReservation,
    handleFetchNextPage,
    reservationsQuery,
    setCurrentView,
  };
}
