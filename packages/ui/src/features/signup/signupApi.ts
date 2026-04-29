import { apiClient } from '@/lib/apiClient';

export interface SignupFormValues {
  memberId: string;
  password: string;
  name: string;
  birthDate: string;
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  buildingManagementNumber: string;
  phoneNumber: string;
  nickname: string;
  verificationCode: string;
}

export interface AddressSearchItem {
  roadAddress: string;
  roadAddressPart1: string;
  roadAddressPart2: string;
  jibunAddress: string;
  englishAddress: string;
  zipCode: string;
  administrativeCode: string;
  roadNameCode: string;
  buildingManagementNumber: string;
  buildingName?: string;
  city?: string;
  district?: string;
  town?: string;
}

export interface AddressSearchResponse {
  totalCount: number;
  currentPage: number;
  countPerPage: number;
  items: AddressSearchItem[];
}

export interface IdAvailabilityResponse {
  available: boolean;
}

export interface PhoneVerificationRequestResponse {
  verificationId: string;
  code: string;
  expiresAt: string;
}

export interface PhoneVerificationConfirmResponse {
  verified: boolean;
}

interface SignupRequest {
  memberId: string;
  password: string;
  name: string;
  birthDate: string;
  address: string;
  phoneNumber: string;
  phoneVerificationId: string;
}

export function searchAddresses(keyword: string) {
  const params = new URLSearchParams({
    keyword,
  });

  return apiClient<AddressSearchResponse>(`/api/addresses?${params}`, {
    skipAuthRedirect: true,
  });
}

export function checkMemberId(memberId: string) {
  const params = new URLSearchParams({
    userId: memberId,
  });

  return apiClient<IdAvailabilityResponse>(`/members/check-user-id?${params}`);
}

export function requestPhoneVerification(phoneNumber: string) {
  return apiClient<PhoneVerificationRequestResponse>('/phone-verifications', {
    body: JSON.stringify({ phoneNumber }),
    method: 'POST',
  });
}

export function confirmPhoneVerification(
  verificationId: string,
  phoneNumber: string,
  verificationCode: string,
) {
  return apiClient<PhoneVerificationConfirmResponse>('/phone-verifications/confirm', {
    body: JSON.stringify({ verificationId, phoneNumber, code: verificationCode }),
    method: 'POST',
  });
}

export function createMember(payload: SignupRequest) {
  return apiClient<{ memberId: string; userId: string }>('/members/signup', {
    body: JSON.stringify({
      userId: payload.memberId,
      password: payload.password,
      name: payload.name,
      birthDate: payload.birthDate,
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      phoneVerificationId: payload.phoneVerificationId,
    }),
    method: 'POST',
  });
}
