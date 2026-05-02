import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { queryKeys } from '@/lib/queryKeys';
import { getSocialLoginUrl, loginWithPassword, type LoginFormValues } from './loginApi';
import { hasLoginErrors, validateLoginForm, type LoginFormErrors } from './loginValidation';

const initialValues: LoginFormValues = {
  memberId: '',
  password: '',
};

export function useLoginPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const { setSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formErrors = useMemo(() => validateLoginForm(values), [values]);
  const redirectTo = getRedirectPath(location.state);
  const passwordLoginMutation = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.auth.me(), session.member);
    },
  });

  const handleChange = (field: keyof LoginFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(formErrors);

    if (hasLoginErrors(formErrors)) {
      return;
    }

    const session = await passwordLoginMutation.mutateAsync(values);
    setSession(session);
    navigate(redirectTo, { replace: true });
  };

  const handleSocialLogin = (provider: 'kakao' | 'naver') => {
    window.location.assign(getSocialLoginUrl(provider));
  };

  return {
    errors,
    handleChange,
    handleSocialLogin,
    handleSubmit,
    passwordLoginMutation,
    values,
  };
}

function getRedirectPath(state: unknown) {
  if (
    state &&
    typeof state === 'object' &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from.startsWith('/')
  ) {
    return state.from;
  }

  return '/movies';
}
