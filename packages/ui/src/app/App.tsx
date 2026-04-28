import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { type PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/login/LoginPage';
import { MoviesPage } from '@/features/movies/MoviesPage';
import { SeatSelectionPage } from '@/features/seats/SeatSelectionPage';
import { SignupPage } from '@/features/signup/SignupPage';

export default function App() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="주요 메뉴">
        <Link className="brand-link" to={isAuthenticated ? '/movies' : '/login'}>
          <p className="eyebrow">GC Project</p>
          <h1>Movie Reservation</h1>
        </Link>
        {isAuthenticated ? (
          <Button onClick={handleLogout} type="button" variant="secondary">
            로그아웃
          </Button>
        ) : null}
      </nav>

      <Routes>
        <Route index element={<Navigate replace to="/login" />} />
        <Route
          path="/login"
          element={
            <LoginPage
              signupLink={
                <Button asChild variant="ghost">
                  <Link to="/signup" viewTransition>
                    회원가입
                  </Link>
                </Button>
              }
            />
          }
        />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/movies"
          element={
            <RequireAuth>
              <MoviesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/movies/:movieId/screenings/:screeningId/seats"
          element={
            <RequireAuth>
              <SeatSelectionPage />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={
            <section className="not-found" aria-labelledby="not-found-title">
              <p className="eyebrow">Not Found</p>
              <h2 id="not-found-title">페이지를 찾을 수 없습니다.</h2>
              <Button asChild>
                <Link to="/login" viewTransition>
                  로그인으로 이동
                </Link>
              </Button>
            </section>
          }
        />
      </Routes>
    </main>
  );
}

function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return children;
}
