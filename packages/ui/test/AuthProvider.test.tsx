import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';

describe('AuthProvider', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-refresh',
    });
  });

  it('401 인증 오류가 발생하면 refresh token으로 토큰 재발급을 한 번만 시도한다', async () => {
    let resolveRefresh!: (response: Response) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthStateProbe />, { wrapper: createWrapper('/movies') });
    fireEvent.click(screen.getByRole('button', { name: '로그인 세션 저장' }));

    await waitFor(() => {
      expect(screen.getByTestId('access-token').textContent).toBe('old-access-token');
    });

    window.dispatchEvent(new CustomEvent('gc-project:auth-error', { detail: { status: 401 } }));
    window.dispatchEvent(new CustomEvent('gc-project:auth-error', { detail: { status: 401 } }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/members/token/refresh',
      expect.objectContaining({
        body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
        method: 'POST',
      }),
    );

    resolveRefresh(
      new Response(
        JSON.stringify({
          memberId: '7',
          userId: 'movie_user',
          accessToken: 'new-access-token',
          accessTokenExpiresAt: '2026-04-29T00:15:00.000Z',
          refreshToken: 'new-refresh-token',
          refreshTokenExpiresAt: '2026-05-13T00:00:00.000Z',
        }),
        { status: 201 },
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('access-token').textContent).toBe('new-access-token');
    });
  });

  it('403 인증 오류가 발생하면 로그아웃하지 않고 권한 없음 팝업을 표시한다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<AuthStateProbe />, { wrapper: createWrapper('/movies') });
    fireEvent.click(screen.getByRole('button', { name: '로그인 세션 저장' }));

    await waitFor(() => {
      expect(screen.getByTestId('access-token').textContent).toBe('old-access-token');
    });

    window.dispatchEvent(new CustomEvent('gc-project:auth-error', { detail: { status: 403 } }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByRole('alertdialog', { name: '권한이 없습니다' })).toBeTruthy();
    expect(screen.getByTestId('access-token').textContent).toBe('old-access-token');

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog', { name: '권한이 없습니다' })).toBeNull();
    });
  });
});

function AuthStateProbe() {
  const { accessToken, setSession } = useAuth();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setSession({
            accessToken: 'old-access-token',
            accessTokenExpiresAt: '2026-04-29T00:00:00.000Z',
            refreshToken: 'old-refresh-token',
            refreshTokenExpiresAt: '2026-05-13T00:00:00.000Z',
            member: {
              id: 7,
              memberId: 'movie_user',
              name: '홍길동',
              nickname: '영화좋아',
            },
          })
        }
      >
        로그인 세션 저장
      </button>
      <span data-testid="access-token">{accessToken ?? 'none'}</span>
    </>
  );
}

function createWrapper(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}
