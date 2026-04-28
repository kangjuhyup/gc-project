import { describe, expect, it } from 'vitest';
import { validateLoginForm } from '@/features/login/loginValidation';

describe('loginValidation', () => {
  it('유효한 로그인 정보면 검증 에러를 반환하지 않는다', () => {
    expect(
      validateLoginForm({
        memberId: 'movie_user',
        password: 'password',
      }),
    ).toEqual({});
  });

  it('회원 아이디와 비밀번호가 비어 있으면 필수 입력 에러를 반환한다', () => {
    expect(
      validateLoginForm({
        memberId: '',
        password: '',
      }),
    ).toEqual({
      memberId: '아이디를 입력해 주세요.',
      password: '비밀번호를 입력해 주세요.',
    });
  });

  it('회원 아이디 형식이 맞지 않으면 형식 에러를 반환한다', () => {
    expect(
      validateLoginForm({
        memberId: 'ab',
        password: 'password',
      }).memberId,
    ).toBe('아이디 형식을 확인해 주세요.');
  });
});
