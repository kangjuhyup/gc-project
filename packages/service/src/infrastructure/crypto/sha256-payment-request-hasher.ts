import { Logging, NoLog } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { PaymentRequestHasherPort, PaymentRequestHashParams } from '@application/commands/ports';

@Injectable()
@Logging
export class Sha256PaymentRequestHasher implements PaymentRequestHasherPort {
  hash(params: PaymentRequestHashParams): string {
    return createHash('sha256')
      .update(this.canonicalize(params))
      .digest('hex');
  }

  @NoLog
  private canonicalize(params: PaymentRequestHashParams): string {
    const seatHoldIds = params.seatHoldIds ?? (params.seatHoldId === undefined ? [] : [params.seatHoldId]);

    return JSON.stringify({
      amount: params.amount,
      memberId: params.memberId,
      provider: params.provider,
      seatHoldIds: [...seatHoldIds].sort(),
    });
  }
}
