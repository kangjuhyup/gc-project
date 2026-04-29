import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { queryKeys } from '@/lib/queryKeys';
import { fetchReservations } from './reservationApi';
import { filterReservations, type ReservationView } from './reservationFilters';

export function useReservationsPage() {
  const { member } = useAuth();
  const [currentView, setCurrentView] = useState<ReservationView>('UPCOMING');
  const reservationsQuery = useQuery({
    enabled: Boolean(member?.id),
    queryKey: member?.id ? queryKeys.reservations.list(member.id) : queryKeys.reservations.all,
    queryFn: () => fetchReservations(member?.id ?? 0),
  });
  const reservations = reservationsQuery.data?.items ?? [];
  const filteredReservations = useMemo(
    () => filterReservations(reservations, currentView),
    [currentView, reservations],
  );

  return {
    currentView,
    filteredReservations,
    reservationsQuery,
    setCurrentView,
  };
}
