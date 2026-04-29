import { ArrowLeft, KeyRound } from 'lucide-react';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { type PasswordChangeFormValues } from './passwordApi';
import { useChangePassword } from './passwordHooks';
import {
  hasPasswordChangeErrors,
  validatePasswordChangeForm,
  type PasswordChangeFormErrors,
} from './passwordValidation';

const initialValues: PasswordChangeFormValues = {
  currentPassword: '',
  newPassword: '',
};

export function PasswordChangePage() {
  const { member } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PasswordChangeFormErrors>({});
  const passwordMutation = useChangePassword();
  const formErrors = useMemo(() => validatePasswordChangeForm(values), [values]);

  const handleChange =
    (field: keyof PasswordChangeFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
      passwordMutation.reset();
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(formErrors);

    if (hasPasswordChangeErrors(formErrors)) {
      return;
    }

    await passwordMutation.mutateAsync({
      ...values,
      userId: member?.memberId ?? '',
    });
    setValues(initialValues);
  };

  return (
    <section className="password-page" aria-labelledby="password-page-title">
      <div className="seat-page-header">
        <Button asChild variant="ghost">
          <Link to="/profile" viewTransition>
            <ArrowLeft size={17} aria-hidden="true" />
            내 프로필
          </Link>
        </Button>
        <div>
          <p className="eyebrow">Account</p>
          <h2 id="password-page-title">비밀번호 변경</h2>
        </div>
      </div>

      <form className="password-form" onSubmit={handleSubmit}>
        <div className="form-section-header">
          <KeyRound size={22} aria-hidden="true" />
          <div>
            <h3>비밀번호 정보</h3>
          </div>
        </div>

        <PasswordField
          autoComplete="current-password"
          error={errors.currentPassword}
          id="currentPassword"
          label="현재 비밀번호"
          onChange={handleChange('currentPassword')}
          value={values.currentPassword}
        />

        <PasswordField
          autoComplete="new-password"
          error={errors.newPassword}
          id="newPassword"
          label="신규 비밀번호"
          onChange={handleChange('newPassword')}
          value={values.newPassword}
        />

        {passwordMutation.isError ? (
          <p className="status-message" data-state="error" role="alert">
            비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해 주세요.
          </p>
        ) : null}

        {passwordMutation.isSuccess ? (
          <p className="success-message" role="status">
            비밀번호가 변경되었습니다.
          </p>
        ) : null}

        <div className="form-actions">
          <Button asChild variant="ghost">
            <Link to="/profile" viewTransition>
              취소
            </Link>
          </Button>
          <Button disabled={passwordMutation.isPending} type="submit">
            변경하기
          </Button>
        </div>
      </form>
    </section>
  );
}

interface PasswordFieldProps {
  autoComplete: string;
  error?: string;
  id: keyof PasswordChangeFormValues;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}

function PasswordField({ autoComplete, error, id, label, onChange, value }: PasswordFieldProps) {
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
        placeholder="비밀번호"
        type="password"
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
