import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { DomainError } from '@domain';

const conflictErrors = new Set([
  'SEAT_ALREADY_HELD',
  'USER_ID_ALREADY_EXISTS',
  'PHONE_NUMBER_ALREADY_EXISTS',
  'PAYMENT_ALREADY_REQUESTED',
  'PAYMENT_IDEMPOTENCY_KEY_CONFLICT',
]);

const badRequestErrors = new Set([
  'CURRENT_PASSWORD_MISMATCH',
  'ADMIN_UNMASK_REASON_REQUIRED',
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
  'SEAT_HOLD_NOT_RELEASABLE',
  'PAYMENT_CALLBACK_INVALID',
  'PAYMENT_PROVIDER_MISMATCH',
  'PAYMENT_PROVIDER_PAYMENT_ID_REQUIRED',
  'PAYMENT_NOT_APPROVED',
  'RESERVATION_CANCEL_NOT_ALLOWED',
  'INVALID_RESERVATION_STATUS',
]);

const forbiddenErrors = new Set([
  'MEMBER_ALREADY_WITHDRAWN',
  'MEMBER_LOCKED',
  'MEMBER_WITHDRAWN',
  'SEAT_HOLD_FORBIDDEN',
  'SEAT_HOLD_PAYMENT_COMPLETED',
  'RESERVATION_FORBIDDEN',
]);

const notFoundErrors = new Set([
  'MEMBER_NOT_FOUND',
  'SEAT_HOLD_NOT_FOUND',
  'PAYMENT_NOT_FOUND',
  'RESERVATION_NOT_FOUND',
]);

const unauthorizedErrors = new Set([
  'INVALID_ADMIN_CREDENTIALS',
]);

@Injectable()
export class ApplicationErrorInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next
      .handle()
      .pipe(catchError((error: Error) => throwError(() => this.map(error))));
  }

  private map(
    error: Error,
  ):
    | BadRequestException
    | ConflictException
    | ForbiddenException
    | HttpException
    | InternalServerErrorException
    | NotFoundException
    | UnauthorizedException {
    if (error instanceof HttpException) {
      return error;
    }

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

    if (unauthorizedErrors.has(code)) {
      return new UnauthorizedException(code);
    }

    return new InternalServerErrorException('INTERNAL_SERVER_ERROR');
  }
}
