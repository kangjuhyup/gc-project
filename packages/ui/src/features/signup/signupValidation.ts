import { type SignupFormValues } from './signupApi';

export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>;

const memberIdPattern = /^[a-z][a-z0-9_]{3,19}$/;
const phoneNumberPattern = /^01[016789]\d{7,8}$/;
const verificationCodePattern = /^\d{6}$/;
const forbiddenAddressKeywordPattern = /[%=><[\]]/;

export function validateMemberId(memberId: string) {
  if (!memberId.trim()) {
    return '아이디를 입력해 주세요.';
  }

  if (!memberIdPattern.test(memberId)) {
    return '아이디는 소문자로 시작하고 소문자, 숫자, 밑줄 4~20자로 입력해 주세요.';
  }

  return undefined;
}

export function validatePhoneNumber(phoneNumber: string) {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized) {
    return '휴대폰번호를 입력해 주세요.';
  }

  if (!phoneNumberPattern.test(normalized)) {
    return '휴대폰번호 형식을 확인해 주세요.';
  }

  return undefined;
}

export function validateVerificationCode(verificationCode: string) {
  if (!verificationCode.trim()) {
    return '인증번호를 입력해 주세요.';
  }

  if (!verificationCodePattern.test(verificationCode)) {
    return '인증번호는 숫자 6자리입니다.';
  }

  return undefined;
}

export function validateAddressKeyword(keyword: string) {
  const trimmedKeyword = keyword.trim();

  if (trimmedKeyword.length < 2) {
    return '주소 검색어는 두 글자 이상 입력해 주세요.';
  }

  if (/^\d+$/.test(trimmedKeyword)) {
    return '도로명, 건물명, 지역명을 함께 입력해 주세요.';
  }

  if (forbiddenAddressKeywordPattern.test(trimmedKeyword)) {
    return '주소 검색어에 사용할 수 없는 문자가 포함되어 있습니다.';
  }

  if (trimmedKeyword.length > 80) {
    return '주소 검색어는 80자 이하로 입력해 주세요.';
  }

  return undefined;
}

export function validateSignupForm(values: SignupFormValues) {
  const errors: SignupFormErrors = {};
  const memberIdError = validateMemberId(values.memberId);
  const phoneNumberError = validatePhoneNumber(values.phoneNumber);
  const verificationCodeError = validateVerificationCode(values.verificationCode);

  if (memberIdError) {
    errors.memberId = memberIdError;
  }

  if (!values.name.trim()) {
    errors.name = '이름을 입력해 주세요.';
  }

  if (!values.password) {
    errors.password = '비밀번호를 입력해 주세요.';
  } else if (values.password.length < 8) {
    errors.password = '비밀번호는 8자 이상이어야 합니다.';
  }

  if (!values.birthDate) {
    errors.birthDate = '생년월일을 선택해 주세요.';
  }

  if (!values.zipCode || !values.roadAddress) {
    errors.roadAddress = '주소 검색 결과에서 주소를 선택해 주세요.';
  }

  if (!values.detailAddress.trim()) {
    errors.detailAddress = '상세주소를 입력해 주세요.';
  }

  if (phoneNumberError) {
    errors.phoneNumber = phoneNumberError;
  }

  if (!values.nickname.trim()) {
    errors.nickname = '닉네임을 입력해 주세요.';
  }

  if (verificationCodeError) {
    errors.verificationCode = verificationCodeError;
  }

  return errors;
}

export function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replaceAll('-', '').replaceAll(' ', '');
}

export function hasErrors(errors: SignupFormErrors) {
  return Object.keys(errors).length > 0;
}
