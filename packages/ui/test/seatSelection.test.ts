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
  it('선택 가능한 좌석을 누르면 선택 상태를 토글한다', () => {
    expect(toggleSeatSelection([], availableSeat)).toEqual([1]);
    expect(toggleSeatSelection([1], availableSeat)).toEqual([]);
  });

  it('선택 불가능한 좌석은 선택하지 않는다', () => {
    expect(toggleSeatSelection([], heldSeat)).toEqual([]);
  });

  it('선택 개수가 제한을 넘지 않도록 유지한다', () => {
    expect(toggleSeatSelection([1, 3], { ...availableSeat, id: 4 }, 2)).toEqual([1, 3]);
  });

  it('선택한 좌석 상세 정보를 선택 순서대로 반환한다', () => {
    expect(getSelectedSeats([availableSeat, heldSeat], [2, 1]).map((seat) => seat.label)).toEqual([
      'A2',
      'A1',
    ]);
  });
});
