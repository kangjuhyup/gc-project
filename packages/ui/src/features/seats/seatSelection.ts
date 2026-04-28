import { type SeatSummary } from './seatApi';

export const MAX_SELECTABLE_SEATS = 8;

export function toggleSeatSelection(
  selectedSeatIds: number[],
  seat: SeatSummary,
  maxSelectableSeats = MAX_SELECTABLE_SEATS,
) {
  if (seat.status !== 'AVAILABLE') {
    return selectedSeatIds;
  }

  if (selectedSeatIds.includes(seat.id)) {
    return selectedSeatIds.filter((seatId) => seatId !== seat.id);
  }

  if (selectedSeatIds.length >= maxSelectableSeats) {
    return selectedSeatIds;
  }

  return [...selectedSeatIds, seat.id];
}

export function getSelectedSeats(seats: SeatSummary[], selectedSeatIds: number[]) {
  return selectedSeatIds
    .map((seatId) => seats.find((seat) => seat.id === seatId))
    .filter((seat): seat is SeatSummary => Boolean(seat));
}
