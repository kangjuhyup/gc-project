import { type LoginFormValues } from './loginApi';

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const memberIdPattern = /^[a-z][a-z0-9_]{3,19}$/;

export function validateLoginForm(values: LoginFormValues) {
  const errors: LoginFormErrors = {};

  if (!values.memberId.trim()) {
    errors.memberId = '아이디를 입력해 주세요.';
  } else if (!memberIdPattern.test(values.memberId)) {
    errors.memberId = '아이디는 소문자로 시작하고 소문자, 숫자, 밑줄 4~20자로 입력해 주세요.';
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해 주세요.';
  }

  return errors;
}

export function hasLoginErrors(errors: LoginFormErrors) {
  return Object.keys(errors).length > 0;
}
