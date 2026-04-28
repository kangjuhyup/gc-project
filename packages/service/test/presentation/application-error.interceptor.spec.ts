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
  it('maps duplicated user id to conflict', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('USER_ID_ALREADY_EXISTS')) as never)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps phone verification errors to bad request', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('PHONE_VERIFICATION_REQUIRED')) as never)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps domain errors to bad request by code', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(
        interceptor.intercept({} as never, next(new DomainError(DomainErrorCode.INVALID_USER_ID)) as never),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps unknown errors to internal server error', async () => {
    const interceptor = new ApplicationErrorInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept({} as never, next(new Error('UNKNOWN')) as never)),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
