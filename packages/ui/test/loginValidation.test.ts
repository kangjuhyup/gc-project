import { describe, expect, it } from 'vitest';
import { validateLoginForm } from '@/features/login/loginValidation';

describe('loginValidation', () => {
  it('returns no errors for valid credentials', () => {
    expect(
      validateLoginForm({
        memberId: 'movie_user',
        password: 'password',
      }),
    ).toEqual({});
  });

  it('requires member id and password', () => {
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

  it('validates member id format', () => {
    expect(
      validateLoginForm({
        memberId: 'ab',
        password: 'password',
      }).memberId,
    ).toBe('아이디 형식을 확인해 주세요.');
  });
});
