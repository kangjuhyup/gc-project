import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { type LoginResponse } from '@/features/login/loginApi';
import { refreshMemberToken, type RefreshMemberTokenResponse } from './authApi';

interface AuthMember {
  id: number;
  memberId: string;
  name: string;
  nickname: string;
}

interface AuthContextValue {
  accessToken: string | null;
  isAuthenticated: boolean;
  member: AuthMember | null;
  logout: () => void;
  setSession: (session: LoginResponse) => void;
}

const AUTH_MEMBER_STORAGE_KEY = 'authMember';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const refreshPromiseRef = useRef<Promise<void> | undefined>(undefined);
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());
  const [member, setMember] = useState<AuthMember | null>(() => readStoredMember());
  const [isForbiddenDialogOpen, setIsForbiddenDialogOpen] = useState(false);

  const logout = useCallback(() => {
    clearStoredAccessToken();
    sessionStorage.removeItem(AUTH_MEMBER_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    setAccessToken(null);
    setMember(null);
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  }, [queryClient]);

  const redirectToLogin = useCallback(() => {
    if (location.pathname !== '/login') {
      navigate('/login', {
        replace: true,
        state: {
          expired: true,
          from: location.pathname,
        },
      });
    }
  }, [location.pathname, navigate]);

  const setSession = useCallback(
    (session: LoginResponse) => {
      setStoredAccessToken(session.accessToken);
      sessionStorage.setItem(AUTH_MEMBER_STORAGE_KEY, JSON.stringify(session.member));
      sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken);
      setAccessToken(session.accessToken);
      setMember(session.member);
      queryClient.setQueryData(queryKeys.auth.me(), session.member);
    },
    [queryClient],
  );

  useEffect(() => {
    const refreshSession = async () => {
      const storedRefreshToken = sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

      if (!storedRefreshToken) {
        throw new Error('refresh token is missing');
      }

      const refreshed = await refreshMemberToken(storedRefreshToken);
      applyRefreshedToken(refreshed, member, {
        queryClient,
        setAccessToken,
        setMember,
      });
    };

    const handleAuthError = (event: Event) => {
      const status = getAuthErrorStatus(event);

      if (status === 403) {
        setIsForbiddenDialogOpen(true);
        return;
      }

      if (status !== 401) {
        logout();
        redirectToLogin();
        return;
      }

      if (refreshPromiseRef.current) {
        return;
      }

      refreshPromiseRef.current = refreshSession()
        .catch(() => {
          logout();
          redirectToLogin();
        })
        .finally(() => {
          refreshPromiseRef.current = undefined;
        });
    };

    window.addEventListener('gc-project:auth-error', handleAuthError);

    return () => {
      window.removeEventListener('gc-project:auth-error', handleAuthError);
    };
  }, [location.pathname, logout, member, queryClient, redirectToLogin]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      member,
      logout,
      setSession,
    }),
    [accessToken, logout, member, setSession],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isForbiddenDialogOpen ? (
        <div className="auth-dialog-backdrop" role="presentation">
          <section
            aria-labelledby="auth-forbidden-title"
            aria-modal="true"
            className="auth-dialog"
            role="alertdialog"
          >
            <p className="eyebrow">Forbidden</p>
            <h2 id="auth-forbidden-title">권한이 없습니다</h2>
            <p>현재 계정으로는 이 기능에 접근할 수 없습니다.</p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => setIsForbiddenDialogOpen(false)}
            >
              확인
            </button>
          </section>
        </div>
      ) : undefined}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

function readStoredMember() {
  const storedMember = sessionStorage.getItem(AUTH_MEMBER_STORAGE_KEY);

  if (!storedMember) {
    return null;
  }

  try {
    return JSON.parse(storedMember) as AuthMember;
  } catch {
    sessionStorage.removeItem(AUTH_MEMBER_STORAGE_KEY);
    return null;
  }
}

function getAuthErrorStatus(event: Event) {
  if (!(event instanceof CustomEvent)) {
    return undefined;
  }

  const detail = event.detail as { status?: number } | undefined;
  return detail?.status;
}

function applyRefreshedToken(
  refreshed: RefreshMemberTokenResponse,
  currentMember: AuthMember | null,
  context: {
    queryClient: QueryClient;
    setAccessToken: (accessToken: string) => void;
    setMember: (member: AuthMember) => void;
  },
) {
  const refreshedMember = currentMember ?? {
    id: Number(refreshed.memberId) || 0,
    memberId: refreshed.userId,
    name: refreshed.userId,
    nickname: refreshed.userId,
  };

  setStoredAccessToken(refreshed.accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshed.refreshToken);
  sessionStorage.setItem(AUTH_MEMBER_STORAGE_KEY, JSON.stringify(refreshedMember));
  context.setAccessToken(refreshed.accessToken);
  context.setMember(refreshedMember);
  context.queryClient.setQueryData(queryKeys.auth.me(), refreshedMember);
}
