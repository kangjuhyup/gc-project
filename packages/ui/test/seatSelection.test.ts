import { describe, expect, it } from 'vitest';
import { type SeatSummary } from '@/features/seats/seatApi';
import { getSelectedSeats, toggleSeatSelection } from '@/features/seats/seatSelection';

const availableSeat: SeatSummary = {
  id: 1,
  label: 'A1',
  row: 'A',
  col: 1,
  type: 'NORMAL',
  status: 'AVAILABLE',
};

const heldSeat: SeatSummary = {
  ...availableSeat,
  id: 2,
  label: 'A2',
  col: 2,
  status: 'HELD',
};

describe('seatSelection', () => {
  it('toggles available seats', () => {
    expect(toggleSeatSelection([], availableSeat)).toEqual([1]);
    expect(toggleSeatSelection([1], availableSeat)).toEqual([]);
  });

  it('does not select unavailable seats', () => {
    expect(toggleSeatSelection([], heldSeat)).toEqual([]);
  });

  it('keeps selections under the limit', () => {
    expect(toggleSeatSelection([1, 3], { ...availableSeat, id: 4 }, 2)).toEqual([1, 3]);
  });

  it('resolves selected seat details in selection order', () => {
    expect(getSelectedSeats([availableSeat, heldSeat], [2, 1]).map((seat) => seat.label)).toEqual([
      'A2',
      'A1',
    ]);
  });
});
