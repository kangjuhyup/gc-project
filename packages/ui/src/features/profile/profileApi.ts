import { apiClient } from '@/lib/apiClient';

export interface WithdrawMemberResponse {
  memberId: string;
  userId: string;
  withdrawn: boolean;
}

export function withdrawMember() {
  return apiClient<WithdrawMemberResponse>('/members/me', {
    method: 'DELETE',
  });
}
