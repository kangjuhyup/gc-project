import { Logging } from '@kangjuhyup/rvlog';
import { Injectable } from '@nestjs/common';
import type { PaymentCallbackVerifierPort } from '@application/commands/ports';

@Injectable()
@Logging
export class LocalPaymentCallbackVerifier implements PaymentCallbackVerifierPort {
  verify(params: { provider: string; token?: string }): boolean {
    if (params.provider !== 'LOCAL') {
      return false;
    }

    return params.token?.startsWith('local:') === true;
  }
}
