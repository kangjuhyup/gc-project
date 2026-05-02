import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '@/features/auth/AuthProvider';
import { withdrawMember } from '@/features/profile/profileApi';
import { useProfilePage } from '@/features/profile/useProfilePage';
import { ApiError } from '@/lib/apiClient';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/profile/profileApi', () => ({
  withdrawMember: vi.fn(),
}));

describe('useProfilePage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: 'access-token',
      isAuthenticated: true,
      logout: vi.fn(),
      member: {
        id: 1,
        memberId: 'movie_user',
        name: '홍길동',
        nickname: '영화좋아',
      },
      setSession: vi.fn(),
    });
  });

  it('회원탈퇴 API가 409를 반환하면 예매 취소 안내 상태로 전환한다', async () => {
    vi.mocked(withdrawMember).mockRejectedValue(
      new ApiError('Conflict', 409, 'correlation-withdraw'),
    );
    const { result } = renderHook(() => useProfilePage(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleWithdraw();
    });

    await waitFor(() => {
      expect(result.current.hasIncompleteReservationError).toBe(true);
    });
    expect(withdrawMember).toHaveBeenCalledOnce();
  });
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  };
}
