import { maskLoggingValue } from '@kangjuhyup/rvlog';
import { describe, expect, it } from 'vitest';
import {
  ChangeMemberPasswordCommand,
  ConfirmPhoneVerificationCommand,
  LoginMemberCommand,
  PhoneVerificationIssuedDto,
  RefreshMemberTokenCommand,
  RequestPhoneVerificationCommand,
  SignupMemberCommand,
  TemporaryPasswordIssuedDto,
} from '@application/commands/dto';
import {
  ListTheatersQuery,
  SearchAddressesQuery,
} from '@application/query/dto';
import {
  ChangeMemberPasswordRequestDto,
  ConfirmPhoneVerificationRequestDto,
  ListTheatersRequestDto,
  LoginMemberRequestDto,
  RefreshMemberTokenRequestDto,
  RequestPhoneVerificationRequestDto,
  SearchAddressesRequestDto,
  SignupMemberRequestDto,
} from '@presentation/dto';

describe('Log masking metadata', () => {
  it('민감한 application command 필드에 로그 마스킹 메타데이터를 설정한다', () => {
    expect(maskLoggingValue(LoginMemberCommand.of({ userId: 'member_01', password: 'password123!' }))).toMatchObject({
      password: '******',
    });
    expect(maskLoggingValue(RefreshMemberTokenCommand.of({ refreshToken: 'refresh-token-0001' }))).toMatchObject({
      refreshToken: '******',
    });
    expect(maskLoggingValue(
      ChangeMemberPasswordCommand.of({
        userId: 'member_01',
        currentPassword: 'password123!',
        newPassword: 'newPassword123!',
      }),
    )).toMatchObject({
      currentPassword: '******',
      newPassword: '******',
    });
    expect(maskLoggingValue(RequestPhoneVerificationCommand.of({ phoneNumber: '01012345678' }))).toMatchObject({
      phoneNumber: '010-****-5678',
    });
    expect(maskLoggingValue(
      ConfirmPhoneVerificationCommand.of({
        verificationId: '1',
        phoneNumber: '01012345678',
        code: '123456',
      }),
    )).toMatchObject({
      phoneNumber: '010-****-5678',
      code: '******',
    });
    expect(maskLoggingValue(
      SignupMemberCommand.of({
        userId: 'member_01',
        password: 'password123!',
        name: '홍길동',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        phoneNumber: '01012345678',
        address: '서울특별시 강남구 테헤란로 427',
        phoneVerificationId: '1',
      }),
    )).toMatchObject({
      password: '******',
      name: '홍*동',
      birthDate: '******',
      phoneNumber: '010-****-5678',
      address: '******',
    });
    expect(maskLoggingValue(SearchAddressesQuery.of({ keyword: '서울특별시 강남구 테헤란로 427' }))).toMatchObject({
      keyword: '******',
    });
    expect(maskLoggingValue(ListTheatersQuery.of({ latitude: 37.5005, longitude: 127.0364 }))).toMatchObject({
      latitude: '******',
      longitude: '******',
    });
  });

  it('민감한 presentation request 필드에 로그 마스킹 메타데이터를 설정한다', () => {
    expect(maskLoggingValue(LoginMemberRequestDto.of({ userId: 'member_01', password: 'password123!' }))).toMatchObject({
      password: '******',
    });
    expect(maskLoggingValue(RefreshMemberTokenRequestDto.of({ refreshToken: 'refresh-token-0001' }))).toMatchObject({
      refreshToken: '******',
    });
    expect(maskLoggingValue(
      ChangeMemberPasswordRequestDto.of({
        userId: 'member_01',
        currentPassword: 'password123!',
        newPassword: 'newPassword123!',
      }),
    )).toMatchObject({
      currentPassword: '******',
      newPassword: '******',
    });
    expect(maskLoggingValue(RequestPhoneVerificationRequestDto.of({ phoneNumber: '01012345678' }))).toMatchObject({
      phoneNumber: '010-****-5678',
    });
    expect(maskLoggingValue(
      ConfirmPhoneVerificationRequestDto.of({
        verificationId: '1',
        phoneNumber: '01012345678',
        code: '123456',
      }),
    )).toMatchObject({
      phoneNumber: '010-****-5678',
      code: '******',
    });
    expect(maskLoggingValue(
      SignupMemberRequestDto.of({
        userId: 'member_01',
        password: 'password123!',
        name: '홍길동',
        birthDate: '1990-01-01',
        phoneNumber: '01012345678',
        address: '서울특별시 강남구 테헤란로 427',
        phoneVerificationId: '1',
      }),
    )).toMatchObject({
      password: '******',
      name: '홍*동',
      birthDate: '******',
      phoneNumber: '010-****-5678',
      address: '******',
    });
    expect(maskLoggingValue(SearchAddressesRequestDto.of({ keyword: '서울특별시 강남구 테헤란로 427' }))).toMatchObject({
      keyword: '******',
    });
    expect(maskLoggingValue(ListTheatersRequestDto.of({ latitude: 37.5005, longitude: 127.0364 }))).toMatchObject({
      latitude: '******',
      longitude: '******',
    });
  });

  it('응답으로 반환되는 인증코드와 임시비밀번호에도 로그 마스킹 메타데이터를 설정한다', () => {
    expect(maskLoggingValue(
      PhoneVerificationIssuedDto.of({
        verificationId: '1',
        code: '123456',
        expiresAt: new Date('2026-04-29T00:05:00.000Z'),
      }),
    )).toMatchObject({ code: '******' });
    expect(maskLoggingValue(
      TemporaryPasswordIssuedDto.of({
        userId: 'member_01',
        temporaryPassword: 'Temp-abc1231!',
      }),
    )).toMatchObject({ temporaryPassword: '******' });
  });
});
