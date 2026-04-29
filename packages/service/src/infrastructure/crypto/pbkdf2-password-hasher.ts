import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import type { PasswordHasherPort } from '@application/commands/ports';

const ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

@Injectable()
@Logging
export class Pbkdf2PasswordHasher implements PasswordHasherPort {
  @NoLog
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return `pbkdf2$${ITERATIONS}$${salt}$${derived}`;
  }

  @NoLog
  async verify(params: { password: string; passwordHash: string }): Promise<boolean> {
    const [algorithm, iterations, salt, hash] = params.passwordHash.split('$');
    if (algorithm !== 'pbkdf2' || iterations === undefined || salt === undefined || hash === undefined) {
      return false;
    }

    const actual = Buffer.from(hash, 'hex');
    const expected = pbkdf2Sync(params.password, salt, Number(iterations), actual.length, DIGEST);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
