import { Armchair, ArrowLeft, Clock, CreditCard } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatScreeningTime } from '@/features/movies/movieTimeline';
import { getSelectedSeats, toggleSeatSelection } from './seatSelection';
import { useScreeningSeats } from './seatHooks';

export function SeatSelectionPage() {
  const { movieId, screeningId } = useParams();
  const parsedScreeningId = Number(screeningId);
  const validScreeningId = Number.isFinite(parsedScreeningId) ? parsedScreeningId : null;
  const seatsQuery = useScreeningSeats(validScreeningId);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const selectedSeats = useMemo(
    () => getSelectedSeats(seatsQuery.data?.seats ?? [], selectedSeatIds),
    [seatsQuery.data?.seats, selectedSeatIds],
  );
  const totalPrice = selectedSeats.length * (seatsQuery.data?.screening.price ?? 0);

  const handleSeatClick = (seatId: number) => {
    const seat = seatsQuery.data?.seats.find((currentSeat) => currentSeat.id === seatId);

    if (!seat) {
      return;
    }

    setSelectedSeatIds((currentSeatIds) => toggleSeatSelection(currentSeatIds, seat));
  };

  if (!validScreeningId) {
    return (
      <section className="empty-state" role="status">
        <p>상영 정보를 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="seat-page" aria-labelledby="seat-page-title">
      <div className="seat-page-header">
        <Button asChild variant="ghost">
          <Link to="/movies" viewTransition>
            <ArrowLeft size={17} aria-hidden="true" />
            영화 목록
          </Link>
        </Button>
        <div>
          <p className="eyebrow">Seat Selection</p>
          <h2 id="seat-page-title">좌석 선택</h2>
        </div>
      </div>

      {seatsQuery.isLoading ? (
        <div className="empty-state" role="status">
          <p>좌석 정보를 불러오고 있습니다.</p>
        </div>
      ) : null}

      {seatsQuery.isError ? (
        <div className="empty-state" role="alert">
          <p>좌석 정보를 불러오지 못했습니다.</p>
        </div>
      ) : null}

      {seatsQuery.data ? (
        <div className="seat-layout">
          <div className="seat-map-panel">
            <header className="screening-summary">
              <div>
                <h3>{seatsQuery.data.screening.movieTitle}</h3>
                <p>
                  <Clock size={16} aria-hidden="true" />
                  {formatScreeningTime(seatsQuery.data.screening.startAt)} ·{' '}
                  {seatsQuery.data.screening.screenName}
                </p>
              </div>
              <span>{selectedSeats.length}석 선택</span>
            </header>

            <div className="screen-indicator" aria-hidden="true">
              SCREEN
            </div>

            <div className="seat-grid" aria-label="좌석 배치">
              {seatsQuery.data.seats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isUnavailable = seat.status !== 'AVAILABLE';

                return (
                  <button
                    aria-label={`${seat.label} 좌석 ${
                      isUnavailable ? '선택 불가' : isSelected ? '선택됨' : '선택 가능'
                    }`}
                    className="seat-button"
                    data-selected={isSelected}
                    data-status={seat.status.toLowerCase()}
                    disabled={isUnavailable}
                    key={seat.id}
                    onClick={() => handleSeatClick(seat.id)}
                    type="button"
                  >
                    <Armchair size={16} aria-hidden="true" />
                    <span>{seat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="seat-legend" aria-label="좌석 상태">
              <span data-status="available">선택 가능</span>
              <span data-status="selected">선택됨</span>
              <span data-status="held">점유</span>
              <span data-status="reserved">예매 완료</span>
            </div>
          </div>

          <aside className="booking-summary" aria-labelledby="booking-summary-title">
            <h3 id="booking-summary-title">예매 요약</h3>
            <dl>
              <div>
                <dt>선택 좌석</dt>
                <dd>{selectedSeats.length ? selectedSeats.map((seat) => seat.label).join(', ') : '-'}</dd>
              </div>
              <div>
                <dt>결제 예정 금액</dt>
                <dd>{totalPrice.toLocaleString()}원</dd>
              </div>
            </dl>
            {selectedSeats.length ? (
              <Button asChild>
                <Link
                  state={{
                    movieTitle: seatsQuery.data.screening.movieTitle,
                    screenName: seatsQuery.data.screening.screenName,
                    screeningId: seatsQuery.data.screening.id,
                    screeningStartAt: seatsQuery.data.screening.startAt,
                    seats: selectedSeats.map((seat) => ({
                      id: seat.id,
                      label: seat.label,
                    })),
                    totalPrice,
                  }}
                  to={`/movies/${movieId ?? '1'}/screenings/${seatsQuery.data.screening.id}/payment`}
                  viewTransition
                >
                  <CreditCard size={17} aria-hidden="true" />
                  결제 진행
                </Link>
              </Button>
            ) : (
              <Button disabled type="button">
                <>
                  <CreditCard size={17} aria-hidden="true" />
                  결제 진행
                </>
              </Button>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
