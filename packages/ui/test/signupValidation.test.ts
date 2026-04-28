import { describe, expect, it } from 'vitest';
import {
  normalizePhoneNumber,
  validateAddressKeyword,
  validateMemberId,
  validatePhoneNumber,
  validateSignupForm,
  validateVerificationCode,
} from '@/features/signup/signupValidation';

describe('signupValidation', () => {
  it('회원 아이디 형식을 검증한다', () => {
    expect(validateMemberId('user_01')).toBeUndefined();
    expect(validateMemberId('ab')).toBe('아이디는 영문, 숫자, 밑줄 4~20자로 입력해 주세요.');
  });

  it('휴대전화번호를 정규화하고 형식을 검증한다', () => {
    expect(normalizePhoneNumber('010-1234-5678')).toBe('01012345678');
    expect(validatePhoneNumber('010-1234-5678')).toBeUndefined();
    expect(validatePhoneNumber('0212345678')).toBe('휴대폰번호 형식을 확인해 주세요.');
  });

  it('숫자 6자리 인증번호를 검증한다', () => {
    expect(validateVerificationCode('123456')).toBeUndefined();
    expect(validateVerificationCode('12345')).toBe('인증번호는 숫자 6자리입니다.');
  });

  it('주소 검색어 길이와 허용 문자를 검증한다', () => {
    expect(validateAddressKeyword('세종대로 110')).toBeUndefined();
    expect(validateAddressKeyword('1')).toBe('주소 검색어는 두 글자 이상 입력해 주세요.');
    expect(validateAddressKeyword('12345')).toBe('도로명, 건물명, 지역명을 함께 입력해 주세요.');
    expect(validateAddressKeyword('세종대로>')).toBe(
      '주소 검색어에 사용할 수 없는 문자가 포함되어 있습니다.',
    );
  });

  it('완성된 회원가입 폼이면 검증 에러를 반환하지 않는다', () => {
    expect(
      validateSignupForm({
        memberId: 'movie_user',
        name: '홍길동',
        birthDate: '1990-01-01',
        zipCode: '04524',
        roadAddress: '서울특별시 중구 세종대로 110',
        jibunAddress: '서울특별시 중구 태평로1가 31',
        detailAddress: '10층',
        buildingManagementNumber: '1114010300100310000000001',
        phoneNumber: '01012345678',
        nickname: '영화좋아',
        verificationCode: '123456',
      }),
    ).toEqual({});
  });
});
