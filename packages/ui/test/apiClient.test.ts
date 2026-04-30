import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiClient,
  clearStoredAccessToken,
  setStoredAccessToken,
} from '@/lib/apiClient';

describe('apiClient', () => {
  afterEach(() => {
    clearStoredAccessToken();
  });

  it('요청에 access token과 correlation id를 첨부한다', async () => {
    setStoredAccessToken('token-1');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-1',
    });

    await apiClient('/me');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer token-1',
          'x-correlation-id': 'correlation-1',
        }),
      }),
    );
  });

  it('인증 실패 응답을 받으면 auth error 이벤트를 발생시킨다', async () => {
    const listener = vi.fn();
    window.addEventListener('gc-project:auth-error', listener);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401, statusText: 'Unauthorized' })),
    );
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-2',
    });

    await expect(apiClient('/me')).rejects.toThrow('Unauthorized');

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('gc-project:auth-error', listener);
  });

  it('요청 옵션이 지정되면 auth redirect 이벤트를 생략한다', async () => {
    const listener = vi.fn();
    window.addEventListener('gc-project:auth-error', listener);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401, statusText: 'Unauthorized' })),
    );
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-3',
    });

    await expect(apiClient('/members/login', { skipAuthRedirect: true })).rejects.toThrow(
      'Unauthorized',
    );

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('gc-project:auth-error', listener);
  });

  it('VITE_API_MODE가 mock이면 실제 fetch 대신 mock API 응답을 반환한다', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock');
    vi.stubGlobal('crypto', {
      randomUUID: () => 'mock-token',
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient<{ accessToken: string }>('/members/login', {
      body: JSON.stringify({ userId: 'movie_user', password: 'password123!' }),
      method: 'POST',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('member:1:mock-token');
  });
});
