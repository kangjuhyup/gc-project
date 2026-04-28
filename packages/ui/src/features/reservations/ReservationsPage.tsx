import { CalendarClock, Clapperboard, TicketCheck } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatScreeningTime } from '@/features/movies/movieTimeline';
import { formatCurrency } from '@/features/payment/paymentSummary';
import {
  filterReservations,
  getReservationViewLabel,
  type ReservationView,
} from './reservationFilters';
import { useReservations } from './reservationHooks';

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
  const { member } = useAuth();
  const [currentView, setCurrentView] = useState<ReservationView>('UPCOMING');
  const reservationsQuery = useReservations(member?.id ?? null);
  const reservations = reservationsQuery.data?.items ?? [];
  const filteredReservations = useMemo(
    () => filterReservations(reservations, currentView),
    [currentView, reservations],
  );

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
    </>
  );
}
