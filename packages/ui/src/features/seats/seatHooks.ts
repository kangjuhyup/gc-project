import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchScreeningSeats } from './seatApi';

export function useScreeningSeats(screeningId: number | null) {
  return useQuery({
    enabled: Boolean(screeningId),
    queryKey: screeningId ? queryKeys.screenings.seats(screeningId) : queryKeys.screenings.all,
    queryFn: () => fetchScreeningSeats(screeningId ?? 0),
  });
}
