import { apiClient } from '@/lib/apiClient';

export interface LoginFormValues {
  memberId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  member: {
    id: number;
    memberId: string;
    name: string;
    nickname: string;
  };
}

interface LoginMemberResultDto {
  memberId: string;
  userId: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function loginWithPassword(values: LoginFormValues) {
  const response = await apiClient<LoginMemberResultDto>('/members/login', {
    body: JSON.stringify({
      userId: values.memberId,
      password: values.password,
    }),
    method: 'POST',
    skipAuthRedirect: true,
  });

  return {
    accessToken: response.accessToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    refreshToken: response.refreshToken,
    refreshTokenExpiresAt: response.refreshTokenExpiresAt,
    member: {
      id: Number(response.memberId) || 0,
      memberId: response.userId,
      name: response.userId,
      nickname: response.userId,
    },
  } satisfies LoginResponse;
}

export function getSocialLoginUrl(provider: 'kakao' | 'naver') {
  return `${API_BASE_URL}/auth/${provider}`;
}
