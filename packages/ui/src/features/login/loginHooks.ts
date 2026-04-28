import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginWithPassword } from './loginApi';
import { queryKeys } from '@/lib/queryKeys';

export function usePasswordLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.auth.me(), session.member);
    },
  });
}
