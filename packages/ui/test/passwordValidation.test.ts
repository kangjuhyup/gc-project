import { describe, expect, it } from 'vitest';
import { validatePasswordChangeForm } from '@/features/profile/passwordValidation';

describe('passwordValidation', () => {
  it('requires current and new password', () => {
    expect(validatePasswordChangeForm({ currentPassword: '', newPassword: '' })).toEqual({
      currentPassword: '현재 비밀번호를 입력해 주세요.',
      newPassword: '신규 비밀번호를 입력해 주세요.',
    });
  });

  it('requires new password to be at least 8 characters', () => {
    expect(
      validatePasswordChangeForm({ currentPassword: 'old-password', newPassword: 'short' }),
    ).toEqual({
      newPassword: '신규 비밀번호는 8자 이상이어야 합니다.',
    });
  });

  it('requires new password to differ from current password', () => {
    expect(
      validatePasswordChangeForm({
        currentPassword: 'same-password',
        newPassword: 'same-password',
      }),
    ).toEqual({
      newPassword: '현재 비밀번호와 다른 비밀번호를 입력해 주세요.',
    });
  });
});
