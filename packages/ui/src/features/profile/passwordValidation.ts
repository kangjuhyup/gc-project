import { type PasswordChangeFormValues } from './passwordApi';

export type PasswordChangeFormErrors = Partial<Record<keyof PasswordChangeFormValues, string>>;

export function validatePasswordChangeForm(values: PasswordChangeFormValues) {
  const errors: PasswordChangeFormErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = '현재 비밀번호를 입력해 주세요.';
  }

  if (!values.newPassword) {
    errors.newPassword = '신규 비밀번호를 입력해 주세요.';
  } else if (values.newPassword.length < 8) {
    errors.newPassword = '신규 비밀번호는 8자 이상이어야 합니다.';
  } else if (values.currentPassword && values.currentPassword === values.newPassword) {
    errors.newPassword = '현재 비밀번호와 다른 비밀번호를 입력해 주세요.';
  }

  return errors;
}

export function hasPasswordChangeErrors(errors: PasswordChangeFormErrors) {
  return Object.keys(errors).length > 0;
}
