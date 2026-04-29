import { useMutation } from '@tanstack/react-query';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { changePassword, type PasswordChangeFormValues } from './passwordApi';
import {
  hasPasswordChangeErrors,
  validatePasswordChangeForm,
  type PasswordChangeFormErrors,
} from './passwordValidation';

const initialValues: PasswordChangeFormValues = {
  currentPassword: '',
  newPassword: '',
};

export function usePasswordChangePage() {
  const { member } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<PasswordChangeFormErrors>({});
  const passwordMutation = useMutation({
    mutationFn: changePassword,
  });
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

  return {
    errors,
    handleChange,
    handleSubmit,
    passwordMutation,
    values,
  };
}
