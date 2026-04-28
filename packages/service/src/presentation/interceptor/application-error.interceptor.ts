import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { DomainError } from '@domain';

const conflictErrors = new Set([
  'USER_ID_ALREADY_EXISTS',
  'PHONE_NUMBER_ALREADY_EXISTS',
]);

const badRequestErrors = new Set([
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
]);

@Injectable()
export class ApplicationErrorInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: Error) => throwError(() => this.map(error))),
    );
  }

  private map(error: Error): BadRequestException | ConflictException | InternalServerErrorException {
    const code = error instanceof DomainError ? error.code : error.message;

    if (conflictErrors.has(code)) {
      return new ConflictException(code);
    }

    if (badRequestErrors.has(code)) {
      return new BadRequestException(code);
    }

    return new InternalServerErrorException('INTERNAL_SERVER_ERROR');
  }
}
