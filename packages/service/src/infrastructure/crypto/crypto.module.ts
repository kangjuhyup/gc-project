import { Module } from '@nestjs/common';
import {
  CLOCK,
  OPAQUE_TOKEN_GENERATOR,
  PASSWORD_HASHER,
  PAYMENT_REQUEST_HASHER,
  TEMPORARY_PASSWORD_GENERATOR,
  VERIFICATION_CODE_GENERATOR,
} from '@application/commands/ports';
import { NumericVerificationCodeGenerator } from './numeric-verification-code-generator';
import { Pbkdf2PasswordHasher } from './pbkdf2-password-hasher';
import { RandomOpaqueTokenGenerator } from './random-opaque-token-generator';
import { RandomTemporaryPasswordGenerator } from './random-temporary-password-generator';
import { Sha256PaymentRequestHasher } from './sha256-payment-request-hasher';
import { SystemClock } from './system-clock';

@Module({
  providers: [
    SystemClock,
    RandomOpaqueTokenGenerator,
    NumericVerificationCodeGenerator,
    Pbkdf2PasswordHasher,
    RandomTemporaryPasswordGenerator,
    Sha256PaymentRequestHasher,
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
    {
      provide: OPAQUE_TOKEN_GENERATOR,
      useExisting: RandomOpaqueTokenGenerator,
    },
    {
      provide: VERIFICATION_CODE_GENERATOR,
      useExisting: NumericVerificationCodeGenerator,
    },
    {
      provide: PASSWORD_HASHER,
      useExisting: Pbkdf2PasswordHasher,
    },
    {
      provide: TEMPORARY_PASSWORD_GENERATOR,
      useExisting: RandomTemporaryPasswordGenerator,
    },
    {
      provide: PAYMENT_REQUEST_HASHER,
      useExisting: Sha256PaymentRequestHasher,
    },
  ],
  exports: [
    CLOCK,
    OPAQUE_TOKEN_GENERATOR,
    VERIFICATION_CODE_GENERATOR,
    PASSWORD_HASHER,
    TEMPORARY_PASSWORD_GENERATOR,
    PAYMENT_REQUEST_HASHER,
  ],
})
export class CryptoModule {}
