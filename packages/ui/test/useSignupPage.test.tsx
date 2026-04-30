import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { type ChangeEvent, type ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSignupPage } from '@/features/signup/useSignupPage';
import {
  checkMemberId,
  confirmPhoneVerification,
  createMember,
  requestPhoneVerification,
} from '@/features/signup/signupApi';

vi.mock('@/features/signup/signupApi', () => ({
  checkMemberId: vi.fn(),
  confirmPhoneVerification: vi.fn(),
  createMember: vi.fn(),
  requestPhoneVerification: vi.fn(),
  searchAddresses: vi.fn(),
}));

describe('useSignupPage', () => {
  beforeEach(() => {
    vi.mocked(checkMemberId).mockResolvedValue({ available: true });
    vi.mocked(confirmPhoneVerification).mockResolvedValue({ verified: true });
    vi.mocked(createMember).mockResolvedValue({
      memberId: 'member_01',
      userId: 'member_01',
    });
    vi.mocked(requestPhoneVerification).mockResolvedValue({
      code: '654321',
      expiresAt: '2026-04-30T10:15:00.000Z',
      verificationId: 'verification-1',
    });
  });

  it('휴대폰 인증번호 받기 API 응답의 code를 인증번호 필드에 자동 입력한다', async () => {
    const { result } = renderHook(() => useSignupPage(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleChange('phoneNumber')({
        target: { value: '01012345678' },
      } as ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleRequestPhoneVerification();
    });

    expect(vi.mocked(requestPhoneVerification).mock.calls[0]?.[0]).toBe('01012345678');
    expect(result.current.values.verificationCode).toBe('654321');
    expect(result.current.phoneVerificationState).toBe('requested');
  });

  it('회원가입이 완료되면 로그인 페이지로 이동한다', async () => {
    const { result } = renderHook(
      () => ({
        location: useLocation(),
        signupPage: useSignupPage(),
      }),
      {
        wrapper: createWrapper('/signup'),
      },
    );

    await fillValidSignupForm(result.current.signupPage);

    await act(async () => {
      await result.current.signupPage.handleCheckMemberId();
    });

    await act(async () => {
      await result.current.signupPage.handleRequestPhoneVerification();
    });

    await act(async () => {
      await result.current.signupPage.handleConfirmPhoneVerification();
    });

    await act(async () => {
      await result.current.signupPage.handleSubmit({
        preventDefault: vi.fn(),
      } as React.FormEvent<HTMLFormElement>);
    });

    expect(createMember).toHaveBeenCalledOnce();
    expect(result.current.location.pathname).toBe('/login');
  });
});

function createWrapper(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    );
  };
}

async function fillValidSignupForm(signupPage: ReturnType<typeof useSignupPage>) {
  const values = {
    birthDate: '1990-01-01',
    memberId: 'member_01',
    name: '홍길동',
    nickname: '영화좋아',
    password: 'password123!',
    phoneNumber: '01012345678',
  } as const;

  act(() => {
    for (const [field, value] of Object.entries(values)) {
      signupPage.handleChange(field as keyof typeof values)({
        target: { value },
      } as ChangeEvent<HTMLInputElement>);
    }
    signupPage.handleSelectAddress({
      administrativeCode: '1168010100',
      buildingManagementNumber: '1168010100101230000000001',
      englishAddress: '123, Teheran-ro, Gangnam-gu, Seoul',
      jibunAddress: '서울특별시 강남구 역삼동 123',
      roadAddress: '서울특별시 강남구 테헤란로 123',
      roadAddressPart1: '서울특별시 강남구 테헤란로 123',
      roadAddressPart2: '',
      roadNameCode: '116803122001',
      zipCode: '06234',
    });
    signupPage.handleChange('detailAddress')({
      target: { value: '101호' },
    } as ChangeEvent<HTMLInputElement>);
  });
}
