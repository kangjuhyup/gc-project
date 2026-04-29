import { apiClient } from '@/lib/apiClient';

export interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordChangeRequest extends PasswordChangeFormValues {
  userId: string;
}

export function changePassword(values: PasswordChangeRequest) {
  return apiClient<{ userId: string; changed: boolean }>('/members/password', {
    body: JSON.stringify(values),
    method: 'POST',
  });
}
