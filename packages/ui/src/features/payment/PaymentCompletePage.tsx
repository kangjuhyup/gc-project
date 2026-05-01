import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, TicketCheck } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatScreeningTime } from "@/features/movies/movieTimeline";
import { fetchReservationDetail } from "@/features/reservations/reservationApi";
import { queryKeys } from "@/lib/queryKeys";
import { formatCurrency, isPaymentCompleteRouteState } from "./paymentSummary";

export function PaymentCompletePage() {
  const location = useLocation();
  const { paymentId } = useParams();
  const completeState = isPaymentCompleteRouteState(location.state)
    ? location.state
    : undefined;
  const payment = completeState?.payment;
  const paymentState = completeState?.paymentState;
  const reservationId = payment?.reservationId;
  const reservationQuery = useQuery({
    enabled: Boolean(reservationId),
    queryKey: reservationId
      ? queryKeys.reservations.detail(reservationId)
      : queryKeys.reservations.detail(""),
    queryFn: () => fetchReservationDetail(reservationId ?? ""),
    retry: 1,
  });
  const reservation = reservationQuery.data;
  const movieTitle = reservation?.movieTitle ?? paymentState?.movieTitle;
  const screeningStartAt =
    reservation?.screeningStartAt ?? paymentState?.screeningStartAt;
  const screenName = reservation?.screenName ?? paymentState?.screenName;
  const seats =
    reservation?.seats ?? paymentState?.seats.map((seat) => seat.label);
  const totalPrice =
    reservation?.paymentAmount ??
    reservation?.totalPrice ??
    paymentState?.totalPrice;

  return (
    <section
      className="payment-complete-page"
      aria-labelledby="payment-complete-title"
    >
      <div className="payment-complete-hero">
        <BadgeCheck size={36} aria-hidden="true" />
        <p className="eyebrow">Payment Complete</p>
        <h2 id="payment-complete-title">결제가 완료되었습니다</h2>
      </div>

      <div className="payment-complete-layout">
        <section
          className="payment-panel"
          aria-labelledby="payment-complete-summary-title"
        >
          <header className="payment-section-header">
            <TicketCheck size={22} aria-hidden="true" />
            <div>
              <h3 id="payment-complete-summary-title">예매 정보</h3>
            </div>
          </header>

          {movieTitle &&
          screeningStartAt &&
          screenName &&
          seats?.length &&
          totalPrice !== undefined ? (
            <dl className="payment-complete-list">
              <div>
                <dt>영화</dt>
                <dd>{movieTitle}</dd>
              </div>
              <div>
                <dt>상영</dt>
                <dd>
                  {formatScreeningTime(screeningStartAt)} · {screenName}
                </dd>
              </div>
              <div>
                <dt>좌석</dt>
                <dd>{seats.join(", ")}</dd>
              </div>
              <div>
                <dt>결제 금액</dt>
                <dd>{formatCurrency(totalPrice)}</dd>
              </div>
              {reservation?.reservationNumber ? (
                <div>
                  <dt>예매 번호</dt>
                  <dd>{reservation.reservationNumber}</dd>
                </div>
              ) : undefined}
            </dl>
          ) : (
            <div className="empty-state" role="status">
              <p>
                표시할 예매 정보가 없습니다. 예매내역에서 확정 상태를 확인해
                주세요.
              </p>
            </div>
          )}
        </section>

        <aside
          className="payment-summary"
          aria-labelledby="payment-complete-status-title"
        >
          <h3 id="payment-complete-status-title">처리 상태</h3>
          <dl>
            <div>
              <dt>결제 ID</dt>
              <dd>{payment?.paymentId ?? paymentId ?? "-"}</dd>
            </div>
            <div>
              <dt>결제 상태</dt>
              <dd>{payment?.status ?? "확인 필요"}</dd>
            </div>
            <div>
              <dt>예매 ID</dt>
              <dd>{reservationId ?? "결제 승인 후 확인 가능"}</dd>
            </div>
            <div>
              <dt>예매 상세</dt>
              <dd>
                {reservationQuery.isLoading
                  ? "불러오는 중"
                  : reservationQuery.isError
                    ? "예매내역에서 다시 확인해 주세요"
                    : reservation
                      ? "연동 완료"
                      : "대기 중"}
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
