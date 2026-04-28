import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { lastValueFrom, throwError } from 'rxjs';
import { DomainError, DomainErrorCode } from '../../src/domain';
import { ApplicationErrorInterceptor } from '../../src/presentation';

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

  it('휴대전화 인증 에러를 bad request 예외로 변환한다', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('PHONE_VERIFICATION_REQUIRED')) as never)),
    ).rejects.toBeInstanceOf(BadRequestException);
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
