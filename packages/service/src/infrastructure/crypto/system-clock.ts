import { Logging } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import type { ClockPort } from '@application/commands/ports';

@Injectable()
@Logging
export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }
}
