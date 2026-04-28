import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkMemberId,
  confirmPhoneVerification,
  createMember,
  requestPhoneVerification,
  searchAddresses,
  type SignupFormValues,
} from './signupApi';
import { queryKeys } from '@/lib/queryKeys';

export function useCheckMemberId() {
  return useMutation({
    mutationFn: checkMemberId,
  });
}

export function useRequestPhoneVerification() {
  return useMutation({
    mutationFn: requestPhoneVerification,
  });
}

export function useConfirmPhoneVerification() {
  return useMutation({
    mutationFn: ({ phoneNumber, verificationCode }: Pick<
      SignupFormValues,
      'phoneNumber' | 'verificationCode'
    >) => confirmPhoneVerification(phoneNumber, verificationCode),
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMember,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.members.idAvailability(variables.memberId),
      });
    },
  });
}

export function useSearchAddresses() {
  return useMutation({
    mutationFn: searchAddresses,
  });
}
