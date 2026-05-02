import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { ApiError } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { withdrawMember } from './profileApi';

export function useProfilePage() {
  const { logout, member } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const withdrawMutation = useMutation({
    mutationFn: withdrawMember,
    onSuccess: () => {
      logout();
      queryClient.removeQueries({ queryKey: queryKeys.members.all });
      navigate('/login', {
        replace: true,
        state: {
          withdrawn: true,
        },
      });
    },
  });

  const openWithdrawConfirm = () => {
    setIsWithdrawConfirmOpen(true);
  };

  const closeWithdrawConfirm = () => {
    if (!withdrawMutation.isPending) {
      setIsWithdrawConfirmOpen(false);
    }
  };

  const handleWithdraw = () => {
    withdrawMutation.mutate();
  };
  const hasIncompleteReservationError =
    withdrawMutation.error instanceof ApiError && withdrawMutation.error.status === 409;

  return {
    closeWithdrawConfirm,
    handleWithdraw,
    hasIncompleteReservationError,
    isWithdrawConfirmOpen,
    member,
    openWithdrawConfirm,
    withdrawMutation,
  };
}
