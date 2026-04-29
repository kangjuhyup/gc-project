import { ArrowLeft, BadgeCheck, CreditCard, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatScreeningTime } from '@/features/movies/movieTimeline';
import { type PaymentMethod } from './paymentApi';
import { formatCurrency } from './paymentSummary';
import { usePaymentPage } from './usePaymentPage';

const paymentMethods: Array<{
  label: string;
  value: PaymentMethod;
}> = [
  { label: '신용/체크카드', value: 'CARD' },
  { label: '카카오페이', value: 'KAKAO_PAY' },
  { label: '네이버페이', value: 'NAVER_PAY' },
];

export function PaymentPage() {
  const {
    agreedToTerms,
    handleAgreementChange,
    handleSubmit,
    paymentMethod,
    paymentMutation,
    paymentState,
    seatSelectionPath,
    setPaymentMethod,
  } = usePaymentPage();

  if (!paymentState) {
    return (
      <section className="payment-page" aria-labelledby="payment-page-title">
        <div className="empty-state" role="status">
          <p>결제할 좌석 정보가 없습니다.</p>
          <Button asChild>
            <Link to={seatSelectionPath} viewTransition>
              좌석 선택으로 이동
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="payment-page" aria-labelledby="payment-page-title">
      <div className="seat-page-header">
        <Button asChild variant="ghost">
          <Link to={seatSelectionPath} viewTransition>
            <ArrowLeft size={17} aria-hidden="true" />
            좌석 선택
          </Link>
        </Button>
        <div>
          <p className="eyebrow">Payment</p>
          <h2 id="payment-page-title">결제 진행</h2>
        </div>
      </div>

      <div className="payment-layout">
        <div className="payment-panel">
          <header className="payment-section-header">
            <WalletCards size={22} aria-hidden="true" />
            <div>
              <h3>결제 수단</h3>
            </div>
          </header>

          <div className="payment-method-grid" role="radiogroup" aria-label="결제 수단">
            {paymentMethods.map((method) => (
              <button
                aria-checked={paymentMethod === method.value}
                className="payment-method"
                data-selected={paymentMethod === method.value}
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                role="radio"
                type="button"
              >
                <CreditCard size={18} aria-hidden="true" />
                {method.label}
              </button>
            ))}
          </div>

          <label className="payment-agreement" htmlFor="payment-agreement">
            <input
              checked={agreedToTerms}
              id="payment-agreement"
              onChange={handleAgreementChange}
              type="checkbox"
            />
            <span>예매 정보와 결제 금액을 확인했습니다.</span>
          </label>

          {paymentMutation.isError ? (
            <p className="status-message" data-state="error" role="alert">
              결제 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          ) : null}

          {paymentMutation.data ? (
            <div className="payment-success" role="status">
              <BadgeCheck size={22} aria-hidden="true" />
              <div>
                <strong>결제 요청이 생성되었습니다.</strong>
                <span>
                  결제 ID {paymentMutation.data[0]?.paymentId}
                  {paymentMutation.data.length > 1 ? ` 외 ${paymentMutation.data.length - 1}건` : ''}
                </span>
                {paymentMutation.data[0]?.approvalUrl ? (
                  <a href={paymentMutation.data[0].approvalUrl} rel="noreferrer" target="_blank">
                    결제 승인으로 이동
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="payment-summary" aria-labelledby="payment-summary-title">
          <h3 id="payment-summary-title">결제 요약</h3>
          <dl>
            <div>
              <dt>영화</dt>
              <dd>{paymentState.movieTitle}</dd>
            </div>
            <div>
              <dt>상영</dt>
              <dd>
                {formatScreeningTime(paymentState.screeningStartAt)} · {paymentState.screenName}
              </dd>
            </div>
            <div>
              <dt>좌석</dt>
              <dd>{paymentState.seats.map((seat) => seat.label).join(', ')}</dd>
            </div>
            <div>
              <dt>총 결제 금액</dt>
              <dd>{formatCurrency(paymentState.totalPrice)}</dd>
            </div>
          </dl>
          <Button
            disabled={!agreedToTerms || paymentMutation.isPending || Boolean(paymentMutation.data)}
            onClick={handleSubmit}
            type="button"
          >
            <CreditCard size={17} aria-hidden="true" />
            {paymentMutation.isPending ? '결제 요청 중' : '결제 요청'}
          </Button>
        </aside>
      </div>
    </section>
  );
}
