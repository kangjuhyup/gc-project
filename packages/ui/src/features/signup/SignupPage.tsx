import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useCheckMemberId,
  useConfirmPhoneVerification,
  useCreateMember,
  useRequestPhoneVerification,
  useSearchAddresses,
} from './signupHooks';
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
import { type AddressSearchItem, type SignupFormValues } from './signupApi';

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

export function SignupPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [idCheckState, setIdCheckState] = useState<IdCheckState>('idle');
  const [phoneVerificationState, setPhoneVerificationState] =
    useState<PhoneVerificationState>('idle');
  const [phoneVerificationId, setPhoneVerificationId] = useState('');
  const [submittedMemberId, setSubmittedMemberId] = useState('');
  const [addressKeyword, setAddressKeyword] = useState('');
  const [addressKeywordError, setAddressKeywordError] = useState('');

  const checkMemberIdMutation = useCheckMemberId();
  const searchAddressesMutation = useSearchAddresses();
  const requestPhoneVerificationMutation = useRequestPhoneVerification();
  const confirmPhoneVerificationMutation = useConfirmPhoneVerification();
  const createMemberMutation = useCreateMember();

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

  return (
    <section className="signup-layout" aria-labelledby="signup-title">
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-section-header">
          <UserPlus size={22} aria-hidden="true" />
          <div>
            <h2 id="signup-title">회원가입</h2>
          </div>
        </div>

        <div className="field-row with-action">
          <TextField
            autoComplete="username"
            error={errors.memberId}
            id="memberId"
            label="아이디"
            onChange={handleChange('memberId')}
            placeholder="movie_user"
            value={values.memberId}
          />
          <Button
            disabled={checkMemberIdMutation.isPending}
            onClick={handleCheckMemberId}
            type="button"
            variant="secondary"
          >
            중복검사
          </Button>
        </div>
        <TextField
          autoComplete="new-password"
          error={errors.password}
          id="password"
          label="비밀번호"
          onChange={handleChange('password')}
          placeholder="password123!"
          type="password"
          value={values.password}
        />
        <StatusMessage
          status={idCheckState}
          idle=""
          success="사용 가능한 아이디입니다."
          failure="이미 사용 중인 아이디입니다."
          pending={checkMemberIdMutation.isPending ? '아이디를 확인하고 있습니다.' : undefined}
          error={checkMemberIdMutation.isError ? '아이디 중복검사에 실패했습니다.' : undefined}
        />

        <div className="field-grid">
          <TextField
            autoComplete="name"
            error={errors.name}
            id="name"
            label="이름"
            onChange={handleChange('name')}
            placeholder="홍길동"
            value={values.name}
          />
          <TextField
            error={errors.birthDate}
            id="birthDate"
            label="생년월일"
            onChange={handleChange('birthDate')}
            type="date"
            value={values.birthDate}
          />
        </div>

        <div className="address-search">
          <div className="field-row with-action">
            <label className="field" htmlFor="addressKeyword">
              <span>주소 검색</span>
              <input
                aria-describedby={addressKeywordError ? 'addressKeyword-error' : undefined}
                aria-invalid={Boolean(addressKeywordError)}
                autoComplete="street-address"
                id="addressKeyword"
                onChange={(event) => {
                  setAddressKeyword(event.target.value);
                  setAddressKeywordError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSearchAddress();
                  }
                }}
                placeholder="도로명, 건물명, 지번을 입력해 주세요"
                value={addressKeyword}
              />
              {addressKeywordError ? (
                <small className="field-error" id="addressKeyword-error">
                  {addressKeywordError}
                </small>
              ) : null}
            </label>
            <Button
              disabled={searchAddressesMutation.isPending}
              onClick={handleSearchAddress}
              type="button"
              variant="secondary"
            >
              주소검색
            </Button>
          </div>

          {searchAddressesMutation.isError ? (
            <p className="status-message" data-state="error" role="alert">
              주소 검색에 실패했습니다. 검색어를 확인한 뒤 다시 시도해 주세요.
            </p>
          ) : null}

          {searchAddressesMutation.data ? (
            <div className="address-results" aria-live="polite">
              <p>
                검색 결과 {searchAddressesMutation.data.totalCount.toLocaleString()}건 중{' '}
                {searchAddressesMutation.data.items.length}건
              </p>
              {searchAddressesMutation.data.items.length > 0 ? (
                <ul>
                  {searchAddressesMutation.data.items.map((address) => (
                    <li key={`${address.buildingManagementNumber}-${address.zipCode}`}>
                      <button type="button" onClick={() => handleSelectAddress(address)}>
                        <strong>{address.roadAddress}</strong>
                        <span>{address.jibunAddress}</span>
                        <small>우편번호 {address.zipCode}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="status-message" data-state="idle">
                  검색 결과가 없습니다. 더 상세한 검색어로 다시 시도해 주세요.
                </p>
              )}
            </div>
          ) : null}

          <div className="field-grid">
            <TextField
              error={errors.roadAddress}
              id="roadAddress"
              label="도로명주소"
              onChange={handleChange('roadAddress')}
              placeholder="주소 검색 결과에서 선택"
              readOnly
              value={values.roadAddress}
            />
            <TextField
              id="zipCode"
              label="우편번호"
              onChange={handleChange('zipCode')}
              placeholder="우편번호"
              readOnly
              value={values.zipCode}
            />
          </div>

          <TextField
            id="jibunAddress"
            label="지번주소"
            onChange={handleChange('jibunAddress')}
            placeholder="주소 검색 결과에서 선택"
            readOnly
            value={values.jibunAddress}
          />

          <TextField
            autoComplete="address-line2"
            error={errors.detailAddress}
            id="detailAddress"
            label="상세주소"
            onChange={handleChange('detailAddress')}
            placeholder="동, 호수 등 상세주소"
            value={values.detailAddress}
          />
        </div>

        <TextField
          autoComplete="nickname"
          error={errors.nickname}
          id="nickname"
          label="닉네임"
          onChange={handleChange('nickname')}
          placeholder="영화좋아"
          value={values.nickname}
        />

        <div className="form-section-header">
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <h3>휴대폰 인증</h3>
            <p>인증번호 확인 후 가입 버튼이 활성화됩니다.</p>
          </div>
        </div>

        <div className="field-row with-action">
          <TextField
            autoComplete="tel"
            error={errors.phoneNumber}
            id="phoneNumber"
            inputMode="tel"
            label="휴대폰번호"
            onChange={handleChange('phoneNumber')}
            placeholder="01012345678"
            value={values.phoneNumber}
          />
          <Button
            disabled={requestPhoneVerificationMutation.isPending}
            onClick={handleRequestPhoneVerification}
            type="button"
            variant="secondary"
          >
            인증번호 받기
          </Button>
        </div>

        <div className="field-row with-action">
          <TextField
            autoComplete="one-time-code"
            error={errors.verificationCode}
            id="verificationCode"
            inputMode="numeric"
            label="인증번호"
            maxLength={6}
            onChange={handleChange('verificationCode')}
            placeholder="123456"
            value={values.verificationCode}
          />
          <Button
            disabled={
              confirmPhoneVerificationMutation.isPending ||
              phoneVerificationState === 'idle'
            }
            onClick={handleConfirmPhoneVerification}
            type="button"
            variant="secondary"
          >
            인증확인
          </Button>
        </div>
        <StatusMessage
          status={phoneVerificationState === 'verified' ? 'available' : 'idle'}
          idle={phoneVerificationState === 'requested' ? '인증번호를 입력해 주세요.' : ''}
          success="휴대폰 인증이 완료되었습니다."
          failure=""
          pending={
            requestPhoneVerificationMutation.isPending || confirmPhoneVerificationMutation.isPending
              ? '휴대폰 인증을 처리하고 있습니다.'
              : undefined
          }
          error={
            requestPhoneVerificationMutation.isError || confirmPhoneVerificationMutation.isError
              ? '휴대폰 인증 처리에 실패했습니다.'
              : undefined
          }
        />

        <div className="form-actions">
          <Button disabled={!canSubmit || isSubmitting} type="submit">
            가입하기
          </Button>
          {submittedMemberId ? (
            <p className="success-message" role="status">
              {submittedMemberId} 회원가입 요청이 완료되었습니다.
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

interface TextFieldProps {
  autoComplete?: string;
  error?: string;
  id: keyof SignupFormValues;
  inputMode?: 'numeric' | 'tel';
  label: string;
  maxLength?: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
  value: string;
}

function TextField({
  autoComplete,
  error,
  id,
  inputMode,
  label,
  maxLength,
  onChange,
  placeholder,
  readOnly = false,
  type = 'text',
  value,
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={id}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type}
        value={value}
      />
      {error ? (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      ) : null}
    </label>
  );
}

interface StatusMessageProps {
  error?: string;
  failure: string;
  idle: string;
  pending?: string;
  status: 'idle' | 'available' | 'unavailable';
  success: string;
}

function StatusMessage({ error, failure, idle, pending, status, success }: StatusMessageProps) {
  const message =
    pending ?? error ?? (status === 'available' ? success : status === 'unavailable' ? failure : idle);

  if (!message) {
    return null;
  }

  return (
    <p className="status-message" data-state={error ? 'error' : status} role="status">
      {message}
    </p>
  );
}
