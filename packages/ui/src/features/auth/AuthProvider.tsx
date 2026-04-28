import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { type LoginResponse } from '@/features/login/loginApi';

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
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());
  const [member, setMember] = useState<AuthMember | null>(() => readStoredMember());

  const logout = useCallback(() => {
    clearStoredAccessToken();
    sessionStorage.removeItem(AUTH_MEMBER_STORAGE_KEY);
    setAccessToken(null);
    setMember(null);
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  }, [queryClient]);

  const setSession = useCallback(
    (session: LoginResponse) => {
      setStoredAccessToken(session.accessToken);
      sessionStorage.setItem(AUTH_MEMBER_STORAGE_KEY, JSON.stringify(session.member));
      setAccessToken(session.accessToken);
      setMember(session.member);
      queryClient.setQueryData(queryKeys.auth.me(), session.member);
    },
    [queryClient],
  );

  useEffect(() => {
    const handleAuthError = () => {
      logout();

      if (location.pathname !== '/login') {
        navigate('/login', {
          replace: true,
          state: {
            expired: true,
            from: location.pathname,
          },
        });
      }
    };

    window.addEventListener('gc-project:auth-error', handleAuthError);

    return () => {
      window.removeEventListener('gc-project:auth-error', handleAuthError);
    };
  }, [location.pathname, logout, navigate]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
