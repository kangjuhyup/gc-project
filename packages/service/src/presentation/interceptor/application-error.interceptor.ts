import { Logging } from '@kangjuhyup/rvlog';
import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { DomainError } from '@domain';

const conflictErrors = new Set([
  'SEAT_ALREADY_HELD',
  'USER_ID_ALREADY_EXISTS',
  'PHONE_NUMBER_ALREADY_EXISTS',
]);

const badRequestErrors = new Set([
  'CURRENT_PASSWORD_MISMATCH',
  'INVALID_LOGIN_CREDENTIALS',
  'INVALID_MOVIE_CURSOR',
  'INVALID_ADDRESS',
  'INVALID_MEMBER_NAME',
  'INVALID_PHONE_NUMBER',
  'INVALID_USER_ID',
  'INVALID_VERIFICATION_CODE',
  'PHONE_VERIFICATION_CODE_MISMATCH',
  'PHONE_VERIFICATION_EXPIRED',
  'PHONE_VERIFICATION_NOT_FOUND',
  'PHONE_VERIFICATION_NOT_PENDING',
  'PHONE_VERIFICATION_REQUIRED',
  'INVALID_SEAT_HOLD_REQUEST',
  'SEAT_NOT_FOUND',
]);

const forbiddenErrors = new Set([
  'MEMBER_LOCKED',
]);

const notFoundErrors = new Set([
  'MEMBER_NOT_FOUND',
]);

@Injectable()
@Logging
export class ApplicationErrorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: Error) => throwError(() => this.map(error))),
    );
  }

  private map(
    error: Error,
  ): BadRequestException | ConflictException | ForbiddenException | InternalServerErrorException | NotFoundException {
    const code = error instanceof DomainError ? error.code : error.message;

    if (conflictErrors.has(code)) {
      return new ConflictException(code);
    }

    if (badRequestErrors.has(code)) {
      return new BadRequestException(code);
    }

    if (forbiddenErrors.has(code)) {
      return new ForbiddenException(code);
    }

    if (notFoundErrors.has(code)) {
      return new NotFoundException(code);
    }

    return new InternalServerErrorException('INTERNAL_SERVER_ERROR');
  }
}
