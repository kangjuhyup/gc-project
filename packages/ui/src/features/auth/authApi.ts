import { apiClient } from '@/lib/apiClient';

export interface LogoutResponse {
  memberId: string;
  loggedOut: boolean;
  revokedRefreshTokenCount: number;
}

export interface RefreshMemberTokenResponse {
  memberId: string;
  userId: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export function logoutMember() {
  return apiClient<LogoutResponse>('/members/logout', {
    method: 'POST',
  });
}

export function refreshMemberToken(refreshToken: string) {
  return apiClient<RefreshMemberTokenResponse>('/members/token/refresh', {
    body: JSON.stringify({ refreshToken }),
    method: 'POST',
    skipAuthRedirect: true,
  });
}
