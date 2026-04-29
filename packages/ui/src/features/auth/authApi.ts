import { apiClient } from '@/lib/apiClient';

export interface LogoutResponse {
  memberId: string;
  loggedOut: boolean;
  revokedRefreshTokenCount: number;
}

export function logoutMember() {
  return apiClient<LogoutResponse>('/members/logout', {
    method: 'POST',
  });
}
