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

  it('attaches access token and correlation id to requests', async () => {
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

  it('dispatches auth error events for unauthorized responses', async () => {
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

  it('skips auth redirect event when requested', async () => {
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
