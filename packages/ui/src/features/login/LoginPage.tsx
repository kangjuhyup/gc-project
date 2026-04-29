import { type ChangeEvent, type ReactNode } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type LoginFormValues } from './loginApi';
import { useLoginPage } from './useLoginPage';

interface LoginPageProps {
  signupLink: ReactNode;
}

export function LoginPage({ signupLink }: LoginPageProps) {
  const { errors, handleChange, handleSocialLogin, handleSubmit, passwordLoginMutation, values } =
    useLoginPage();

  return (
    <section className="auth-layout login-layout" aria-labelledby="login-title">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-section-header">
          <LockKeyhole size={22} aria-hidden="true" />
          <div>
            <h2 id="login-title">로그인</h2>
          </div>
        </div>

        <LoginField
          autoComplete="username"
          error={errors.memberId}
          id="memberId"
          label="아이디"
          onChange={handleChange('memberId')}
          placeholder="movie_user"
          value={values.memberId}
        />

        <LoginField
          autoComplete="current-password"
          error={errors.password}
          id="password"
          label="비밀번호"
          onChange={handleChange('password')}
          placeholder="비밀번호"
          type="password"
          value={values.password}
        />

        {passwordLoginMutation.isError ? (
          <p className="status-message" data-state="error" role="alert">
            로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.
          </p>
        ) : null}

        <div className="form-actions split">
          {signupLink}
          <Button disabled={passwordLoginMutation.isPending} type="submit">
            로그인
          </Button>
        </div>

        <div className="social-login-area" aria-label="소셜 로그인">
          <div className="divider">
            <span>또는</span>
          </div>
          <div className="social-buttons">
            <button
              className="social-button kakao"
              onClick={() => handleSocialLogin('kakao')}
              type="button"
            >
              <span aria-hidden="true">K</span>
              카카오 로그인
            </button>
            <button
              className="social-button naver"
              onClick={() => handleSocialLogin('naver')}
              type="button"
            >
              <span aria-hidden="true">N</span>
              네이버 로그인
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

interface LoginFieldProps {
  autoComplete?: string;
  error?: string;
  id: keyof LoginFormValues;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
  value: string;
}

function LoginField({
  autoComplete,
  error,
  id,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: LoginFieldProps) {
  const errorId = `${id}-error`;

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={id}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      ) : null}
    </label>
  );
}
