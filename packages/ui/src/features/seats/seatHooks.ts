import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { createSeatHold, fetchScreeningSeats } from './seatApi';

const SEAT_POLLING_INTERVAL_MS = 60_000;

export function useScreeningSeats(screeningId: number | null) {
  return useQuery({
    enabled: Boolean(screeningId),
    queryKey: screeningId ? queryKeys.screenings.seats(screeningId) : queryKeys.screenings.all,
    queryFn: () => fetchScreeningSeats(screeningId ?? 0),
    refetchInterval: SEAT_POLLING_INTERVAL_MS,
  });
}

export function useCreateSeatHold() {
  return useMutation({
    mutationFn: createSeatHold,
  });
}
