import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchReservations } from './reservationApi';

export function useReservations(memberId: number | null) {
  return useQuery({
    enabled: Boolean(memberId),
    queryKey: memberId ? queryKeys.reservations.list(memberId) : queryKeys.reservations.all,
    queryFn: () => fetchReservations(memberId ?? 0),
  });
}
