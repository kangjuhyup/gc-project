import { apiClient } from '@/lib/apiClient';

export interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
}

export function changePassword(values: PasswordChangeFormValues) {
  return apiClient<{ changed: boolean }>('/members/password', {
    body: JSON.stringify(values),
    method: 'PATCH',
  });
}
