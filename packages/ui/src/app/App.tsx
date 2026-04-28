import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginPage } from '@/features/login/LoginPage';
import { SignupPage } from '@/features/signup/SignupPage';

export default function App() {
  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="주요 메뉴">
        <Link className="brand-link" to="/login">
          <p className="eyebrow">GC Project</p>
          <h1>Movie Reservation</h1>
        </Link>
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
