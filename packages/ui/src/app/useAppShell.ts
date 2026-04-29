import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { logoutMember } from '@/features/auth/authApi';

export function useAppShell() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const logoutMutation = useMutation({
    mutationFn: logoutMember,
    onSettled: () => {
      logout();
      navigate('/login', { replace: true });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return {
    handleLogout,
    isAuthenticated,
    logoutMutation,
  };
}
