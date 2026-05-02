import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, TicketCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatScreeningTime } from '@/features/movies/movieTimeline';
import { fetchReservationDetail } from '@/features/reservations/reservationApi';
import { queryKeys } from '@/lib/queryKeys';
import {
  formatCurrency,
  isPaymentCompleteRouteState,
  summarizePaymentCompleteReservations,
} from './paymentSummary';

export function PaymentCompletePage() {
  const location = useLocation();
  const { paymentId } = useParams();
  const completeState = isPaymentCompleteRouteState(location.state) ? location.state : undefined;
  const payment = completeState?.payment;
  const payments = completeState?.payments ?? (payment ? [payment] : []);
  const paymentState = completeState?.paymentState;
  const reservationIds = [
    ...new Set(
      payments
        .map((item) => item.reservationId)
        .filter((reservationId): reservationId is string => Boolean(reservationId)),
    ),
  ];
  const reservationQueries = useQueries({
    queries: reservationIds.map((reservationId) => ({
      enabled: Boolean(reservationId),
      queryKey: queryKeys.reservations.detail(reservationId),
      queryFn: () => fetchReservationDetail(reservationId),
      retry: 1,
    })),
  });
  const reservations = reservationQueries
    .map((query) => query.data)
    .filter((reservation) => reservation !== undefined);
  const summary = summarizePaymentCompleteReservations({
    paymentState,
    reservations,
  });
  const reservationLookupLoading = reservationQueries.some((query) => query.isLoading);
  const reservationLookupError = reservationQueries.some((query) => query.isError);
  const paymentIds = payments.map((item) => item.paymentId);
  const paymentStatuses = [...new Set(payments.map((item) => item.status))];

  return (
    <section className="payment-complete-page" aria-labelledby="payment-complete-title">
      <div className="payment-complete-hero">
        <BadgeCheck size={36} aria-hidden="true" />
        <p className="eyebrow">Payment Complete</p>
        <h2 id="payment-complete-title">결제가 완료되었습니다</h2>
      </div>

      <div className="payment-complete-layout">
        <section className="payment-panel" aria-labelledby="payment-complete-summary-title">
          <header className="payment-section-header">
            <TicketCheck size={22} aria-hidden="true" />
            <div>
              <h3 id="payment-complete-summary-title">예매 정보</h3>
            </div>
          </header>

          {summary.movieTitle &&
          summary.screeningStartAt &&
          summary.screenName &&
          summary.seats?.length &&
          summary.totalPrice !== undefined ? (
            <dl className="payment-complete-list">
              <div>
                <dt>영화</dt>
                <dd>{summary.movieTitle}</dd>
              </div>
              <div>
                <dt>상영</dt>
                <dd>
                  {formatScreeningTime(summary.screeningStartAt)} · {summary.screenName}
                </dd>
              </div>
              <div>
                <dt>좌석</dt>
                <dd>{summary.seats.join(', ')}</dd>
              </div>
              <div>
                <dt>결제 금액</dt>
                <dd>{formatCurrency(summary.totalPrice)}</dd>
              </div>
              {summary.reservationNumbers.length > 0 ? (
                <div>
                  <dt>예매 번호</dt>
                  <dd>{summary.reservationNumbers.join(', ')}</dd>
                </div>
              ) : undefined}
            </dl>
          ) : (
            <div className="empty-state" role="status">
              <p>표시할 예매 정보가 없습니다. 예매내역에서 확정 상태를 확인해 주세요.</p>
            </div>
          )}
        </section>

        <aside className="payment-summary" aria-labelledby="payment-complete-status-title">
          <h3 id="payment-complete-status-title">처리 상태</h3>
          <dl>
            <div>
              <dt>결제 ID</dt>
              <dd>{paymentIds.length > 0 ? paymentIds.join(', ') : (paymentId ?? '-')}</dd>
            </div>
            <div>
              <dt>결제 상태</dt>
              <dd>{paymentStatuses.length > 0 ? paymentStatuses.join(', ') : '확인 필요'}</dd>
            </div>
            <div>
              <dt>예매 ID</dt>
              <dd>
                {reservationIds.length > 0 ? reservationIds.join(', ') : '결제 승인 후 확인 가능'}
              </dd>
            </div>
            <div>
              <dt>예매 상세</dt>
              <dd>
                {reservationLookupLoading
                  ? '불러오는 중'
                  : reservationLookupError
                    ? '예매내역에서 다시 확인해 주세요'
                    : reservations.length > 0
                      ? '연동 완료'
                      : '대기 중'}
              </dd>
            </div>
          </dl>
          <div className="payment-complete-actions">
            <Button asChild>
              <Link to="/reservations" viewTransition>
                예매내역 보기
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/movies" viewTransition>
                영화 목록
              </Link>
            </Button>
          </div>
        </aside>
      </div>

      <Button asChild variant="ghost">
        <Link to="/movies" viewTransition>
          <ArrowLeft size={17} aria-hidden="true" />
          영화 목록으로 돌아가기
        </Link>
      </Button>
    </section>
  );
}
