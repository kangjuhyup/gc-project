import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { TemporaryPasswordGeneratorPort } from '@application/commands/ports';

@Injectable()
export class RandomTemporaryPasswordGenerator implements TemporaryPasswordGeneratorPort {
  generate(): string {
    return `Temp-${randomBytes(6).toString('base64url')}1!`;
  }
}
