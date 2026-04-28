import { apiClient } from '@/lib/apiClient';

export interface LoginFormValues {
  memberId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  member: {
    id: number;
    memberId: string;
    name: string;
    nickname: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function loginWithPassword(values: LoginFormValues) {
  return apiClient<LoginResponse>('/auth/login', {
    body: JSON.stringify(values),
    method: 'POST',
    skipAuthRedirect: true,
  });
}

export function getSocialLoginUrl(provider: 'kakao' | 'naver') {
  return `${API_BASE_URL}/auth/${provider}`;
}
