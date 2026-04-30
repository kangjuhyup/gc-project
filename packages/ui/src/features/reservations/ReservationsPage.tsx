import { CalendarClock, Clapperboard, TicketCheck, XCircle } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatScreeningTime } from '@/features/movies/movieTimeline';
import { formatCurrency } from '@/features/payment/paymentSummary';
import {
  canCancelReservation,
  getReservationViewLabel,
  type ReservationView,
} from './reservationFilters';
import { useReservationsPage } from './useReservationsPage';

const reservationViews: ReservationView[] = ['UPCOMING', 'COMPLETED', 'CANCELED'];

export function ReservationsPage() {
  return (
    <section className="reservations-page" aria-labelledby="reservations-page-title">
      <header className="reservations-header">
        <div>
          <p className="eyebrow">My Reservations</p>
          <h2 id="reservations-page-title">내 예매내역</h2>
        </div>
        <Button asChild variant="secondary">
          <Link to="/movies" viewTransition>
            영화 목록
          </Link>
        </Button>
      </header>

      <ReservationHistoryPanel />
    </section>
  );
}

interface ReservationHistoryPanelProps {
  actionSlot?: ReactNode;
}

export function ReservationHistoryPanel({ actionSlot }: ReservationHistoryPanelProps) {
  const {
    cancelErrorReservationId,
    cancelReservationMutation,
    currentView,
    filteredReservations,
    handleCancelReservation,
    handleFetchNextPage,
    reservationsQuery,
    setCurrentView,
  } = useReservationsPage();

  return (
    <>
      <div className="reservation-tabs" role="tablist" aria-label="예매내역 분류">
        {reservationViews.map((view) => (
          <button
            aria-selected={currentView === view}
            data-selected={currentView === view}
            key={view}
            onClick={() => setCurrentView(view)}
            role="tab"
            type="button"
          >
            {getReservationViewLabel(view)}
          </button>
        ))}
      </div>

      {reservationsQuery.isLoading ? (
        <div className="empty-state" role="status">
          <p>예매내역을 불러오고 있습니다.</p>
        </div>
      ) : null}

      {reservationsQuery.isError ? (
        <div className="empty-state" role="alert">
          <p>예매내역을 불러오지 못했습니다.</p>
        </div>
      ) : null}

      {!reservationsQuery.isLoading && !reservationsQuery.isError ? (
        filteredReservations.length ? (
          <div className="reservation-list">
            {filteredReservations.map((reservation) => (
              <article className="reservation-card" key={reservation.id}>
                <img alt={`${reservation.movieTitle} 포스터`} src={reservation.posterUrl} />
                <div className="reservation-card-body">
                  <div className="reservation-title-row">
                    <span data-status={reservation.status.toLowerCase()}>
                      {reservation.status === 'CONFIRMED' ? '예매확정' : '취소됨'}
                    </span>
                    <h3>{reservation.movieTitle}</h3>
                  </div>
                  <dl className="reservation-meta">
                    <div>
                      <dt>
                        <TicketCheck size={15} aria-hidden="true" />
                        예매번호
                      </dt>
                      <dd>{reservation.reservationNumber}</dd>
                    </div>
                    <div>
                      <dt>
                        <CalendarClock size={15} aria-hidden="true" />
                        상영
                      </dt>
                      <dd>
                        {formatScreeningTime(reservation.screeningStartAt)} ·{' '}
                        {reservation.screenName}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <Clapperboard size={15} aria-hidden="true" />
                        좌석
                      </dt>
                      <dd>{reservation.seats.join(', ')}</dd>
                    </div>
                    <div>
                      <dt>결제금액</dt>
                      <dd>{formatCurrency(reservation.totalPrice)}</dd>
                    </div>
                  </dl>
                  {reservation.cancelReason ? (
                    <p className="reservation-note">{reservation.cancelReason}</p>
                  ) : null}
                  {cancelErrorReservationId === reservation.id ? (
                    <p className="reservation-note" data-state="error" role="alert">
                      예매 취소 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.
                    </p>
                  ) : null}
                  {canCancelReservation(reservation) ? (
                    <div className="reservation-actions">
                      <Button
                        disabled={
                          cancelReservationMutation.isPending &&
                          cancelReservationMutation.variables === reservation.id
                        }
                        onClick={() => handleCancelReservation(reservation.id)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <XCircle size={15} aria-hidden="true" />
                        {cancelReservationMutation.isPending &&
                        cancelReservationMutation.variables === reservation.id
                          ? '취소 요청 중'
                          : '예매 취소'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state" role="status">
            <p>{getReservationViewLabel(currentView)} 예매내역이 없습니다.</p>
            {actionSlot}
          </div>
        )
      ) : null}

      {!reservationsQuery.isLoading && !reservationsQuery.isError && reservationsQuery.hasNextPage ? (
        <div className="reservation-actions reservation-actions-centered">
          <Button
            disabled={reservationsQuery.isFetchingNextPage}
            onClick={handleFetchNextPage}
            type="button"
            variant="secondary"
          >
            {reservationsQuery.isFetchingNextPage ? '불러오는 중' : '더 보기'}
          </Button>
        </div>
      ) : null}
    </>
  );
}
