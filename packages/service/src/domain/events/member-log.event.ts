import type { DomainEvent } from './domain-event';

export class MemberSignedUpLogEvent implements DomainEvent {
  private constructor(
    readonly memberId: string,
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}

  static of(params: { memberId: string; userId: string; occurredAt: Date }): MemberSignedUpLogEvent {
    return new MemberSignedUpLogEvent(params.memberId, params.userId, params.occurredAt);
  }
}

export class LoginFailedLogEvent implements DomainEvent {
  private constructor(
    readonly userId: string,
    readonly failedLoginCount: number,
    readonly locked: boolean,
    readonly occurredAt: Date,
  ) {}

  static of(params: {
    userId: string;
    failedLoginCount: number;
    locked: boolean;
    occurredAt: Date;
  }): LoginFailedLogEvent {
    return new LoginFailedLogEvent(params.userId, params.failedLoginCount, params.locked, params.occurredAt);
  }
}

export class LoginSucceededLogEvent implements DomainEvent {
  private constructor(
    readonly memberId: string,
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}

  static of(params: { memberId: string; userId: string; occurredAt: Date }): LoginSucceededLogEvent {
    return new LoginSucceededLogEvent(params.memberId, params.userId, params.occurredAt);
  }
}

export class MemberPasswordChangedLogEvent implements DomainEvent {
  private constructor(
    readonly memberId: string,
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}

  static of(params: { memberId: string; userId: string; occurredAt: Date }): MemberPasswordChangedLogEvent {
    return new MemberPasswordChangedLogEvent(params.memberId, params.userId, params.occurredAt);
  }
}
