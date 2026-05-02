import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { queryKeys } from '@/lib/queryKeys';
import { createSeatHold, fetchScreeningSeats, releaseSeatHold } from './seatApi';
import { getSelectedSeats, toggleSeatSelection } from './seatSelection';

const SEAT_POLLING_INTERVAL_MS = 60_000;

export function useSeatSelectionPage() {
  const { movieId, screeningId } = useParams();
  const location = useLocation();
  const parsedScreeningId = Number(screeningId);
  const validScreeningId = Number.isFinite(parsedScreeningId) ? parsedScreeningId : null;
  const seatsQuery = useQuery({
    enabled: Boolean(validScreeningId),
    queryKey: validScreeningId
      ? queryKeys.screenings.seats(validScreeningId)
      : queryKeys.screenings.all,
    queryFn: () => fetchScreeningSeats(validScreeningId ?? 0),
    refetchInterval: SEAT_POLLING_INTERVAL_MS,
  });
  const seatHoldMutation = useMutation({
    mutationFn: createSeatHold,
  });
  const routeScreening = getSeatRouteState(location.state);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const heldSeatIdsRef = useRef(new Map<string, string>());
  const isPaymentNavigationRef = useRef(false);
  const screeningSummary = {
    id: seatsQuery.data?.screening.id ?? String(validScreeningId ?? ''),
    movieTitle: routeScreening?.movieTitle ?? seatsQuery.data?.screening.movieTitle ?? '상영 좌석',
    screenName: routeScreening?.screenName ?? seatsQuery.data?.screening.screenName ?? '상영관',
    startAt:
      routeScreening?.screeningStartAt ??
      seatsQuery.data?.screening.startAt ??
      new Date().toISOString(),
    endAt:
      routeScreening?.screeningEndAt ??
      seatsQuery.data?.screening.endAt ??
      new Date().toISOString(),
    price: seatsQuery.data?.screening.price ?? 14000,
  };
  const selectedSeats = useMemo(
    () => getSelectedSeats(seatsQuery.data?.seats ?? [], selectedSeatIds),
    [seatsQuery.data?.seats, selectedSeatIds],
  );
  const totalPrice = selectedSeats.length * screeningSummary.price;
  const paymentRouteState = useMemo(
    () => ({
      movieTitle: screeningSummary.movieTitle,
      screenName: screeningSummary.screenName,
      screeningId: screeningSummary.id,
      screeningStartAt: screeningSummary.startAt,
      seats: selectedSeats.map((seat) => ({
        id: seat.id,
        label: seat.label,
      })),
      seatHoldIds: selectedSeats
        .map((seat) => heldSeatIdsRef.current.get(seat.id))
        .filter((holdId): holdId is string => typeof holdId === 'string'),
      totalPrice,
    }),
    [
      screeningSummary.id,
      screeningSummary.movieTitle,
      screeningSummary.screenName,
      screeningSummary.startAt,
      selectedSeats,
      totalPrice,
    ],
  );
  const canProceedToPayment =
    selectedSeats.length > 0 && paymentRouteState.seatHoldIds.length === selectedSeats.length;

  const releaseHeldSeat = useCallback(
    async (seatId: string, options: Pick<RequestInit, 'keepalive'> = {}) => {
      const holdId = heldSeatIdsRef.current.get(seatId);

      if (!holdId) {
        return;
      }

      heldSeatIdsRef.current.delete(seatId);

      try {
        await releaseSeatHold(holdId, options);
      } catch {
        if (!options.keepalive) {
          heldSeatIdsRef.current.set(seatId, holdId);
        }
      }
    },
    [],
  );

  const releaseAllHeldSeats = useCallback((options: Pick<RequestInit, 'keepalive'> = {}) => {
    const holdIds = Array.from(heldSeatIdsRef.current.values());

    heldSeatIdsRef.current.clear();

    void Promise.all(
      holdIds.map((holdId) => releaseSeatHold(holdId, options).catch(() => undefined)),
    );
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      if (!isPaymentNavigationRef.current) {
        releaseAllHeldSeats({ keepalive: true });
      }
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);

      if (!isPaymentNavigationRef.current) {
        releaseAllHeldSeats({ keepalive: true });
      }
    };
  }, [releaseAllHeldSeats]);

  const handleSeatClick = async (seatId: string) => {
    const seat = seatsQuery.data?.seats.find((currentSeat) => currentSeat.id === seatId);

    if (!seat) {
      return;
    }

    if (selectedSeatIds.includes(seat.id)) {
      await releaseHeldSeat(seat.id);
      setSelectedSeatIds((currentSeatIds) => toggleSeatSelection(currentSeatIds, seat));
      await seatsQuery.refetch();
      return;
    }

    if (seat.status !== 'AVAILABLE' || !validScreeningId) {
      return;
    }

    const holdResponse = await seatHoldMutation.mutateAsync({
      screeningId: String(validScreeningId),
      seatIds: [seat.id],
    });
    const holdId = holdResponse.holdIds[0];

    if (!holdId) {
      await seatsQuery.refetch();
      return;
    }

    heldSeatIdsRef.current.set(seat.id, holdId);
    setSelectedSeatIds((currentSeatIds) => toggleSeatSelection(currentSeatIds, seat));
    await seatsQuery.refetch();
  };

  const handlePaymentNavigation = () => {
    isPaymentNavigationRef.current = true;
  };

  return {
    handlePaymentNavigation,
    handleSeatClick,
    canProceedToPayment,
    movieId,
    paymentRouteState,
    screeningSummary,
    seatHoldMutation,
    seatsQuery,
    selectedSeatIds,
    selectedSeats,
    totalPrice,
    validScreeningId,
  };
}

interface SeatRouteState {
  movieTitle: string;
  screenName: string;
  screeningStartAt: string;
  screeningEndAt: string;
}

function getSeatRouteState(value: unknown): SeatRouteState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const state = value as Partial<SeatRouteState>;

  if (
    typeof state.movieTitle === 'string' &&
    typeof state.screenName === 'string' &&
    typeof state.screeningStartAt === 'string' &&
    typeof state.screeningEndAt === 'string'
  ) {
    return state as SeatRouteState;
  }

  return null;
}
