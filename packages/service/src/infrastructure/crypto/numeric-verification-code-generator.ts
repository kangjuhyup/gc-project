import { Logging } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import type { VerificationCodeGeneratorPort } from '@application/commands/ports';

@Injectable()
@Logging
export class NumericVerificationCodeGenerator implements VerificationCodeGeneratorPort {
  generate(): string {
    return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  }
}
