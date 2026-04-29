import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearStoredAccessToken, setStoredAccessToken } from '@/lib/apiClient';
import { loginWithPassword } from '@/features/login/loginApi';
import { logoutMember } from '@/features/auth/authApi';
import { withdrawMember } from '@/features/profile/profileApi';

describe('auth api', () => {
  afterEach(() => {
    clearStoredAccessToken();
  });

  it('OpenAPI 로그인 응답의 access token을 세션 토큰으로 변환한다', async () => {
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-login',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            memberId: '7',
            userId: 'movie_user',
            accessToken: 'member:7:token',
            accessTokenExpiresAt: '2026-04-29T00:15:00.000Z',
            refreshToken: 'refresh-token',
            refreshTokenExpiresAt: '2026-05-13T00:00:00.000Z',
          }),
          { status: 201 },
        ),
      ),
    );

    const session = await loginWithPassword({
      memberId: 'movie_user',
      password: 'password123!',
    });

    expect(session.accessToken).toBe('member:7:token');
    expect(session.refreshToken).toBe('refresh-token');
    expect(session.member).toEqual({
      id: 7,
      memberId: 'movie_user',
      name: 'movie_user',
      nickname: 'movie_user',
    });
  });

  it('로그아웃 요청을 인증 토큰과 함께 전송한다', async () => {
    setStoredAccessToken('member:7:token');
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-logout',
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          memberId: '7',
          loggedOut: true,
          revokedRefreshTokenCount: 1,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await logoutMember();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/members/logout',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer member:7:token',
        }),
      }),
    );
  });

  it('회원탈퇴 요청을 DELETE /members/me로 전송한다', async () => {
    setStoredAccessToken('member:7:token');
    vi.stubGlobal('crypto', {
      randomUUID: () => 'correlation-withdraw',
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          memberId: '7',
          userId: 'movie_user',
          withdrawn: true,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await withdrawMember();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/members/me',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          authorization: 'Bearer member:7:token',
        }),
      }),
    );
  });
});
