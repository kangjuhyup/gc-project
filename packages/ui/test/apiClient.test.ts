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

    await expect(apiClient('/auth/login', { skipAuthRedirect: true })).rejects.toThrow(
      'Unauthorized',
    );

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener('gc-project:auth-error', listener);
  });
});
