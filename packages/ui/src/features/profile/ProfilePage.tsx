import { IdCard, KeyRound, Mail, UserRound, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ReservationHistoryPanel } from '@/features/reservations/ReservationsPage';
import { useProfilePage } from './useProfilePage';

export function ProfilePage() {
  const {
    closeWithdrawConfirm,
    handleWithdraw,
    hasIncompleteReservationError,
    isWithdrawConfirmOpen,
    member,
    openWithdrawConfirm,
    withdrawMutation,
  } = useProfilePage();

  return (
    <section className="profile-page" aria-labelledby="profile-page-title">
      <header className="profile-header">
        <div>
          <p className="eyebrow">My Profile</p>
          <h2 id="profile-page-title">내 프로필</h2>
        </div>
        <Button asChild variant="secondary">
          <Link to="/movies" viewTransition>
            영화 목록
          </Link>
        </Button>
      </header>

      <section className="profile-card" aria-labelledby="profile-info-title">
        <div className="profile-avatar" aria-hidden="true">
          <UserRound size={32} />
        </div>
        <div className="profile-info">
          <h3 id="profile-info-title">{member?.nickname || member?.name || '회원'}</h3>
          <dl>
            <div>
              <dt>
                <IdCard size={15} aria-hidden="true" />
                아이디
              </dt>
              <dd>{member?.memberId ?? '-'}</dd>
            </div>
            <div>
              <dt>
                <UserRound size={15} aria-hidden="true" />
                이름
              </dt>
              <dd>{member?.name ?? '-'}</dd>
            </div>
            <div>
              <dt>
                <Mail size={15} aria-hidden="true" />
                닉네임
              </dt>
              <dd>{member?.nickname ?? '-'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="profile-actions-card" aria-labelledby="profile-actions-title">
        <div>
          <p className="eyebrow">Account</p>
          <h3 id="profile-actions-title">계정 관리</h3>
        </div>
        <div className="profile-action-buttons">
          <Button asChild variant="secondary">
            <Link to="/profile/password" viewTransition>
              <KeyRound size={17} aria-hidden="true" />
              비밀번호 변경
            </Link>
          </Button>
          <Button
            className="danger-button"
            disabled={withdrawMutation.isPending}
            onClick={openWithdrawConfirm}
            type="button"
            variant="secondary"
          >
            <UserX size={17} aria-hidden="true" />
            회원탈퇴
          </Button>
        </div>
        {isWithdrawConfirmOpen ? (
          <div className="withdraw-confirm" role="alertdialog" aria-labelledby="withdraw-title">
            <div>
              <h4 id="withdraw-title">회원탈퇴를 진행할까요?</h4>
              <p>탈퇴 후에는 같은 계정으로 로그인할 수 없습니다.</p>
            </div>
            {withdrawMutation.isError ? (
              <p className="status-message" data-state="error" role="alert">
                {hasIncompleteReservationError
                  ? '예매 내역이 있어 회원탈퇴를 진행할 수 없습니다. 예매내역에서 먼저 예매를 취소해 주세요.'
                  : '회원탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.'}
              </p>
            ) : null}
            <div className="withdraw-confirm-actions">
              {hasIncompleteReservationError ? (
                <Button asChild disabled={withdrawMutation.isPending} variant="secondary">
                  <Link to="/reservations" viewTransition>
                    예매내역으로 이동
                  </Link>
                </Button>
              ) : null}
              <Button
                disabled={withdrawMutation.isPending}
                onClick={closeWithdrawConfirm}
                type="button"
                variant="ghost"
              >
                취소
              </Button>
              <Button
                className="danger-button"
                disabled={withdrawMutation.isPending}
                onClick={handleWithdraw}
                type="button"
                variant="secondary"
              >
                {withdrawMutation.isPending ? '처리 중' : '탈퇴하기'}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="profile-reservations" aria-labelledby="profile-reservations-title">
        <div className="profile-section-heading">
          <div>
            <p className="eyebrow">Reservation History</p>
            <h3 id="profile-reservations-title">내 예매내역</h3>
          </div>
          <Button asChild variant="ghost">
            <Link to="/reservations" viewTransition>
              전체 화면으로 보기
            </Link>
          </Button>
        </div>
        <ReservationHistoryPanel
          actionSlot={
            <Button asChild>
              <Link to="/movies" viewTransition>
                영화 예매하기
              </Link>
            </Button>
          }
        />
      </section>
    </section>
  );
}
