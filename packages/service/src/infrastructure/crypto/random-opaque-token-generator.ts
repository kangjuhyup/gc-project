import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { OpaqueTokenGeneratorPort } from '@application/commands/ports';

@Injectable()
export class RandomOpaqueTokenGenerator implements OpaqueTokenGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
