import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { lastValueFrom, throwError } from 'rxjs';
import { DomainError, DomainErrorCode } from '@domain';
import { ApplicationErrorInterceptor } from '@presentation';

function next(error: Error) {
  return {
    handle: () => throwError(() => error),
  };
}

describe('ApplicationErrorInterceptor', () => {
  it('중복 회원 아이디 에러를 conflict 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('USER_ID_ALREADY_EXISTS')) as never)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('이미 임시점유된 좌석 에러를 conflict 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('SEAT_ALREADY_HELD')) as never)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('휴대전화 인증 에러를 bad request 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('PHONE_VERIFICATION_REQUIRED')) as never)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('로그인 실패 에러를 bad request 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('INVALID_LOGIN_CREDENTIALS')) as never)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('기존 비밀번호 불일치 에러를 bad request 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('CURRENT_PASSWORD_MISMATCH')) as never)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('잠긴 회원 에러를 forbidden 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('MEMBER_LOCKED')) as never)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('다른 회원의 좌석 선점 해제 에러를 forbidden 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('SEAT_HOLD_FORBIDDEN')) as never)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('다른 회원의 예매 취소 에러를 forbidden 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('RESERVATION_FORBIDDEN')) as never)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('회원 없음 에러를 not found 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('MEMBER_NOT_FOUND')) as never)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('좌석 선점 없음 에러를 not found 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('SEAT_HOLD_NOT_FOUND')) as never)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('예매 없음 에러를 not found 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('RESERVATION_NOT_FOUND')) as never)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('도메인 에러를 코드 기준으로 bad request 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(
        interceptor.intercept({} as never, next(new DomainError(DomainErrorCode.INVALID_USER_ID)) as never),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('알 수 없는 에러를 internal server error 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('UNKNOWN')) as never)),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
