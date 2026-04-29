import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import {
  checkMemberId,
  confirmPhoneVerification,
  createMember,
  requestPhoneVerification,
  searchAddresses,
  type AddressSearchItem,
  type SignupFormValues,
} from './signupApi';
import {
  hasErrors,
  normalizePhoneNumber,
  validateAddressKeyword,
  validateMemberId,
  validatePhoneNumber,
  validateSignupForm,
  validateVerificationCode,
  type SignupFormErrors,
} from './signupValidation';

const initialValues: SignupFormValues = {
  memberId: '',
  password: '',
  name: '',
  birthDate: '',
  zipCode: '',
  roadAddress: '',
  jibunAddress: '',
  detailAddress: '',
  buildingManagementNumber: '',
  phoneNumber: '',
  nickname: '',
  verificationCode: '',
};

type IdCheckState = 'idle' | 'available' | 'unavailable';
type PhoneVerificationState = 'idle' | 'requested' | 'verified';

export function useSignupPage() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [idCheckState, setIdCheckState] = useState<IdCheckState>('idle');
  const [phoneVerificationState, setPhoneVerificationState] =
    useState<PhoneVerificationState>('idle');
  const [phoneVerificationId, setPhoneVerificationId] = useState('');
  const [submittedMemberId, setSubmittedMemberId] = useState('');
  const [addressKeyword, setAddressKeyword] = useState('');
  const [addressKeywordError, setAddressKeywordError] = useState('');
  const checkMemberIdMutation = useMutation({
    mutationFn: checkMemberId,
  });
  const searchAddressesMutation = useMutation({
    mutationFn: searchAddresses,
  });
  const requestPhoneVerificationMutation = useMutation({
    mutationFn: requestPhoneVerification,
  });
  const confirmPhoneVerificationMutation = useMutation({
    mutationFn: ({
      phoneNumber,
      verificationCode,
      verificationId,
    }: Pick<SignupFormValues, 'phoneNumber' | 'verificationCode'> & {
      verificationId: string;
    }) => confirmPhoneVerification(verificationId, phoneNumber, verificationCode),
  });
  const createMemberMutation = useMutation({
    mutationFn: createMember,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.members.idAvailability(variables.memberId),
      });
    },
  });
  const isSubmitting = createMemberMutation.isPending;
  const canSubmit = idCheckState === 'available' && phoneVerificationState === 'verified';
  const formErrors = useMemo(() => validateSignupForm(values), [values]);

  const handleChange =
    (field: keyof SignupFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;

      setValues((current) => ({
        ...current,
        [field]: nextValue,
      }));
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));

      if (field === 'memberId') {
        setIdCheckState('idle');
      }

      if (field === 'phoneNumber') {
        setPhoneVerificationState('idle');
        setPhoneVerificationId('');
      }

      if (field === 'verificationCode') {
        setPhoneVerificationState((current) => (current === 'verified' ? 'requested' : current));
      }
    };

  const handleAddressKeywordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAddressKeyword(event.target.value);
    setAddressKeywordError('');
  };

  const handleAddressKeywordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSearchAddress();
    }
  };

  const handleCheckMemberId = async () => {
    const memberIdError = validateMemberId(values.memberId);

    if (memberIdError) {
      setErrors((current) => ({ ...current, memberId: memberIdError }));
      return;
    }

    const result = await checkMemberIdMutation.mutateAsync(values.memberId);
    setIdCheckState(result.available ? 'available' : 'unavailable');
  };

  const handleRequestPhoneVerification = async () => {
    const phoneNumberError = validatePhoneNumber(values.phoneNumber);

    if (phoneNumberError) {
      setErrors((current) => ({ ...current, phoneNumber: phoneNumberError }));
      return;
    }

    const result = await requestPhoneVerificationMutation.mutateAsync(
      normalizePhoneNumber(values.phoneNumber),
    );
    setPhoneVerificationId(result.verificationId);
    setPhoneVerificationState('requested');
  };

  const handleSearchAddress = async () => {
    const keywordError = validateAddressKeyword(addressKeyword);

    if (keywordError) {
      setAddressKeywordError(keywordError);
      return;
    }

    setAddressKeywordError('');
    await searchAddressesMutation.mutateAsync(addressKeyword.trim());
  };

  const handleSelectAddress = (address: AddressSearchItem) => {
    setValues((current) => ({
      ...current,
      zipCode: address.zipCode,
      roadAddress: address.roadAddress,
      jibunAddress: address.jibunAddress,
      buildingManagementNumber: address.buildingManagementNumber,
      detailAddress: '',
    }));
    setErrors((current) => ({
      ...current,
      roadAddress: undefined,
    }));
  };

  const handleConfirmPhoneVerification = async () => {
    const phoneNumberError = validatePhoneNumber(values.phoneNumber);
    const verificationCodeError = validateVerificationCode(values.verificationCode);

    if (phoneNumberError || verificationCodeError) {
      setErrors((current) => ({
        ...current,
        phoneNumber: phoneNumberError,
        verificationCode: verificationCodeError,
      }));
      return;
    }

    const result = await confirmPhoneVerificationMutation.mutateAsync({
      phoneNumber: normalizePhoneNumber(values.phoneNumber),
      verificationCode: values.verificationCode,
      verificationId: phoneVerificationId,
    });

    if (result.verified) {
      setPhoneVerificationState('verified');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(formErrors);

    if (hasErrors(formErrors) || !canSubmit) {
      return;
    }

    const result = await createMemberMutation.mutateAsync({
      memberId: values.memberId,
      password: values.password,
      name: values.name,
      birthDate: values.birthDate,
      address: `${values.roadAddress} ${values.detailAddress}`.trim(),
      phoneNumber: normalizePhoneNumber(values.phoneNumber),
      phoneVerificationId,
    });

    setSubmittedMemberId(result.memberId);
  };

  return {
    addressKeyword,
    addressKeywordError,
    canSubmit,
    checkMemberIdMutation,
    confirmPhoneVerificationMutation,
    errors,
    handleAddressKeywordChange,
    handleAddressKeywordKeyDown,
    handleChange,
    handleCheckMemberId,
    handleConfirmPhoneVerification,
    handleRequestPhoneVerification,
    handleSearchAddress,
    handleSelectAddress,
    handleSubmit,
    idCheckState,
    isSubmitting,
    phoneVerificationState,
    requestPhoneVerificationMutation,
    searchAddressesMutation,
    submittedMemberId,
    values,
  };
}
