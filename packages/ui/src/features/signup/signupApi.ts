import { apiClient } from '@/lib/apiClient';

export interface SignupFormValues {
  memberId: string;
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
  expiresInSeconds: number;
}

export interface PhoneVerificationConfirmResponse {
  verified: boolean;
  verificationToken: string;
}

interface SignupRequest {
  memberId: string;
  name: string;
  birthDate: string;
  address: {
    zipCode: string;
    roadAddress: string;
    jibunAddress: string;
    detailAddress: string;
    buildingManagementNumber: string;
  };
  phoneNumber: string;
  nickname: string;
  phoneVerificationToken: string;
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
  return apiClient<IdAvailabilityResponse>('/members/check-id', {
    body: JSON.stringify({ memberId }),
    method: 'POST',
  });
}

export function requestPhoneVerification(phoneNumber: string) {
  return apiClient<PhoneVerificationRequestResponse>('/members/phone-verifications', {
    body: JSON.stringify({ phoneNumber }),
    method: 'POST',
  });
}

export function confirmPhoneVerification(phoneNumber: string, verificationCode: string) {
  return apiClient<PhoneVerificationConfirmResponse>('/members/phone-verifications/confirm', {
    body: JSON.stringify({ phoneNumber, verificationCode }),
    method: 'POST',
  });
}

export function createMember(payload: SignupRequest) {
  return apiClient<{ memberId: string }>('/members', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}
