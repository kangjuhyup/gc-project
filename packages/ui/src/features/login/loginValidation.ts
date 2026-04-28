import { type LoginFormValues } from './loginApi';

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const memberIdPattern = /^[a-zA-Z0-9_]{4,20}$/;

export function validateLoginForm(values: LoginFormValues) {
  const errors: LoginFormErrors = {};

  if (!values.memberId.trim()) {
    errors.memberId = '아이디를 입력해 주세요.';
  } else if (!memberIdPattern.test(values.memberId)) {
    errors.memberId = '아이디 형식을 확인해 주세요.';
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해 주세요.';
  }

  return errors;
}

export function hasLoginErrors(errors: LoginFormErrors) {
  return Object.keys(errors).length > 0;
}
