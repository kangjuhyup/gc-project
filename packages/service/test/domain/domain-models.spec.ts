import { describe, expect, it } from 'vitest';
import {
  DomainError,
  DomainErrorCode,
  MemberModel,
  MovieImageModel,
  MovieModel,
  OutboxEventModel,
  PaymentEventLogModel,
  PaymentModel,
  PhoneVerificationModel,
  RefreshTokenModel,
  ReservationEventModel,
  ReservationModel,
  ReservationSeatModel,
  ScreenModel,
  ScreeningModel,
  SeatHoldModel,
  SeatModel,
  TheaterModel,
} from '@domain';

describe('domain persistence models', () => {
  it('회원 persistence 속성으로 회원 도메인 모델을 생성한다', () => {
    const birthDate = new Date('1990-01-01T00:00:00.000Z');

    const member = MemberModel.of({
      userId: 'member_01',
      passwordHash: 'hashed-password',
      name: 'Member',
      birthDate,
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: 'ACTIVE',
      failedLoginCount: 0,
    });

    expect(member.userId).toBe('member_01');
    expect(member.name).toBe('Member');
    expect(member.birthDate).toBe(birthDate);
    expect(member.phoneNumber).toBe('01000000000');
    expect(member.address).toBe('Seoul');
    expect(member.status).toBe('ACTIVE');
  });

  it('회원가입 시 기본 상태를 ACTIVE로 설정한다', () => {
    const birthDate = new Date('1990-01-01T00:00:00.000Z');

    const member = MemberModel.register({
      userId: 'member_01',
      passwordHash: 'hashed-password',
      name: 'Member',
      birthDate,
      phoneNumber: '01000000000',
      address: 'Seoul',
    });

    expect(member.userId).toBe('member_01');
    expect(member.status).toBe('ACTIVE');
  });

  it('유효하지 않은 회원 아이디로 가입하면 도메인 에러를 던진다', () => {
    expect(() =>
      MemberModel.register({
        userId: '1',
        passwordHash: 'hashed-password',
        name: 'Member',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        phoneNumber: '01000000000',
        address: 'Seoul',
      }),
    ).toThrow(new DomainError(DomainErrorCode.INVALID_USER_ID));
  });

  it('로그인 실패가 5회 누적되면 회원 상태를 LOCKED로 변경한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const now = new Date('2026-04-28T00:05:00.000Z');
    const member = MemberModel.of({
      userId: 'member_01',
      passwordHash: 'hashed-password',
      name: 'Member',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: 'ACTIVE',
      failedLoginCount: 4,
    }).setPersistence('member-1', createdAt, createdAt);

    const locked = member.recordLoginFailure(now);

    expect(locked.status).toBe('LOCKED');
    expect(locked.failedLoginCount).toBe(5);
    expect(locked.lockedAt).toBe(now);
  });

  it('임시비밀번호를 발급하면 비밀번호 해시를 교체하고 잠금을 해제한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const now = new Date('2026-04-28T00:05:00.000Z');
    const member = MemberModel.of({
      userId: 'member_01',
      passwordHash: 'old-hash',
      name: 'Member',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: 'LOCKED',
      failedLoginCount: 5,
      lockedAt: createdAt,
    }).setPersistence('member-1', createdAt, createdAt);

    const unlocked = member.issueTemporaryPassword({ passwordHash: 'new-hash', now });

    expect(unlocked.passwordHash).toBe('new-hash');
    expect(unlocked.status).toBe('ACTIVE');
    expect(unlocked.failedLoginCount).toBe(0);
    expect(unlocked.lockedAt).toBeUndefined();
  });

  it('비밀번호를 변경하면 비밀번호 해시만 신규 해시로 교체한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const now = new Date('2026-04-28T00:05:00.000Z');
    const member = MemberModel.of({
      userId: 'member_01',
      passwordHash: 'old-hash',
      name: 'Member',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: 'ACTIVE',
      failedLoginCount: 2,
    }).setPersistence('member-1', createdAt, createdAt);

    const changed = member.changePassword({ passwordHash: 'new-hash', now });

    expect(changed.passwordHash).toBe('new-hash');
    expect(changed.status).toBe('ACTIVE');
    expect(changed.failedLoginCount).toBe(2);
  });

  it('회원탈퇴를 하면 회원 상태를 WITHDRAWN으로 변경하고 잠금 정보를 초기화한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const now = new Date('2026-04-28T00:05:00.000Z');
    const member = MemberModel.of({
      userId: 'member_01',
      passwordHash: 'old-hash',
      name: 'Member',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: 'LOCKED',
      failedLoginCount: 5,
      lockedAt: createdAt,
    }).setPersistence('member-1', createdAt, createdAt);

    const withdrawn = member.withdraw(now);

    expect(withdrawn.status).toBe('WITHDRAWN');
    expect(withdrawn.failedLoginCount).toBe(0);
    expect(withdrawn.lockedAt).toBeUndefined();
    expect(withdrawn.updatedAt).toBe(now);
  });

  it('잠긴 회원은 로그인할 수 없다', () => {
    const member = MemberModel.of({
      userId: 'member_01',
      passwordHash: 'old-hash',
      name: 'Member',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: 'LOCKED',
      failedLoginCount: 5,
    });

    expect(() => member.assertCanLogin()).toThrow('MEMBER_LOCKED');
  });

  it('영화와 상영 persistence 속성으로 도메인 모델을 생성한다', () => {
    const releaseDate = new Date('2026-04-28T00:00:00.000Z');
    const startAt = new Date('2026-04-28T09:00:00.000Z');
    const endAt = new Date('2026-04-28T11:00:00.000Z');

    const movie = MovieModel.of({
      title: 'Test Movie',
      director: 'Director',
      genre: 'Drama',
      runningTime: 120,
      rating: '15',
      releaseDate,
      posterUrl: 'https://example.com/poster.png',
      description: 'Description',
    });

    const screening = ScreeningModel.of({
      movieId: '1',
      screenId: '2',
      startAt,
      endAt,
      price: 12000,
    });
    const movieImage = MovieImageModel.of({
      movieId: '1',
      imageType: 'POSTER',
      url: 'https://example.com/poster.jpg',
      sortOrder: 0,
    });

    expect(movie.title).toBe('Test Movie');
    expect(movie.runningTime).toBe(120);
    expect(movie.rating).toBe('15');
    expect(movie.releaseDate).toBe(releaseDate);
    expect(screening.movieId).toBe('1');
    expect(screening.screenId).toBe('2');
    expect(screening.startAt).toBe(startAt);
    expect(screening.endAt).toBe(endAt);
    expect(screening.price).toBe(12000);
    expect(movieImage.movieId).toBe('1');
    expect(movieImage.imageType).toBe('POSTER');
    expect(movieImage.url).toBe('https://example.com/poster.jpg');
  });

  it('극장과 상영관과 좌석 persistence 속성으로 도메인 모델을 생성한다', () => {
    const theater = TheaterModel.of({
      name: 'GC 시네마 강남',
      address: '서울특별시 강남구 테헤란로 427',
      latitude: 37.5065,
      longitude: 127.053,
    });

    const screen = ScreenModel.of({
      theaterId: '1',
      name: 'IMAX',
      totalSeats: 100,
    });

    const seat = SeatModel.of({
      screenId: '1',
      seatRow: 'A',
      seatCol: 1,
      seatType: 'NORMAL',
    });

    expect(theater.name).toBe('GC 시네마 강남');
    expect(theater.address).toBe('서울특별시 강남구 테헤란로 427');
    expect(theater.latitude).toBe(37.5065);
    expect(theater.longitude).toBe(127.053);
    expect(screen.theaterId).toBe('1');
    expect(screen.name).toBe('IMAX');
    expect(screen.totalSeats).toBe(100);
    expect(seat.screenId).toBe('1');
    expect(seat.seatRow).toBe('A');
    expect(seat.seatCol).toBe(1);
    expect(seat.seatType).toBe('NORMAL');
  });

  it('예약 관련 persistence 속성으로 도메인 모델을 생성한다', () => {
    const canceledAt = new Date('2026-04-28T12:00:00.000Z');

    const reservation = ReservationModel.of({
      reservationNumber: 'R20260428001',
      memberId: '1',
      screeningId: '2',
      status: 'CANCELED',
      totalPrice: 24000,
      canceledAt,
      cancelReason: 'user request',
    });

    const reservationSeat = ReservationSeatModel.of({
      reservationId: '3',
      screeningId: '2',
      seatId: '4',
    });

    const reservationEvent = ReservationEventModel.of({
      reservationId: '3',
      eventType: 'CANCELED',
      description: 'user request',
    });

    expect(reservation.reservationNumber).toBe('R20260428001');
    expect(reservation.status).toBe('CANCELED');
    expect(reservation.totalPrice).toBe(24000);
    expect(reservation.canceledAt).toBe(canceledAt);
    expect(reservation.cancelReason).toBe('user request');
    expect(reservationSeat.reservationId).toBe('3');
    expect(reservationSeat.screeningId).toBe('2');
    expect(reservationSeat.seatId).toBe('4');
    expect(reservationEvent.reservationId).toBe('3');
    expect(reservationEvent.eventType).toBe('CANCELED');
    expect(reservationEvent.description).toBe('user request');
  });

  it('확정된 예매를 취소하면 CANCELED 상태와 취소 사유를 기록한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const canceledAt = new Date('2026-04-29T01:05:00.000Z');
    const reservation = ReservationModel.of({
      reservationNumber: 'R20260429001',
      memberId: '1',
      screeningId: '2',
      status: 'CONFIRMED',
      totalPrice: 15000,
    }).setPersistence('reservation-1', createdAt, createdAt);

    const canceled = reservation.cancel({ reason: 'user request', now: canceledAt });

    expect(canceled.status).toBe('CANCELED');
    expect(canceled.canceledAt).toBe(canceledAt);
    expect(canceled.cancelReason).toBe('user request');
    expect(canceled.updatedAt).toBe(canceledAt);
  });

  it('확정 상태가 아닌 예매는 취소할 수 없다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const reservation = ReservationModel.of({
      reservationNumber: 'R20260429001',
      memberId: '1',
      screeningId: '2',
      status: 'CANCELED',
      totalPrice: 15000,
    }).setPersistence('reservation-1', createdAt, createdAt);

    expect(() =>
      reservation.cancel({ reason: 'again', now: new Date('2026-04-29T01:05:00.000Z') }),
    ).toThrow(new DomainError(DomainErrorCode.INVALID_RESERVATION_STATUS));
  });

  it('다른 회원의 예매는 소유권 검증에서 거부한다', () => {
    const reservation = ReservationModel.of({
      reservationNumber: 'R20260429001',
      memberId: '1',
      screeningId: '2',
      status: 'CONFIRMED',
      totalPrice: 15000,
    });

    expect(() => reservation.assertOwnedBy('2')).toThrow('RESERVATION_FORBIDDEN');
  });

  it('좌석 선점 persistence 속성으로 도메인 모델을 생성한다', () => {
    const expiresAt = new Date('2026-04-28T09:05:00.000Z');

    const seatHold = SeatHoldModel.of({
      screeningId: '1',
      seatId: '2',
      memberId: '3',
      reservationId: '4',
      status: 'HELD',
      expiresAt,
    });

    expect(seatHold.screeningId).toBe('1');
    expect(seatHold.seatId).toBe('2');
    expect(seatHold.memberId).toBe('3');
    expect(seatHold.reservationId).toBe('4');
    expect(seatHold.status).toBe('HELD');
    expect(seatHold.expiresAt).toBe(expiresAt);
  });

  it('결제 요청은 PENDING 상태의 결제 도메인 모델을 생성한다', () => {
    const requestedAt = new Date('2026-04-29T01:00:00.000Z');

    const payment = PaymentModel.request({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      provider: 'LOCAL',
      amount: 15000,
      now: requestedAt,
    });

    expect(payment.memberId).toBe('1');
    expect(payment.seatHoldId).toBe('10');
    expect(payment.idempotencyKey).toBe('pay-test-key');
    expect(payment.requestHash).toBe('request-hash');
    expect(payment.provider).toBe('LOCAL');
    expect(payment.amount).toBe(15000);
    expect(payment.status).toBe('PENDING');
    expect(payment.requestedAt).toBe(requestedAt);
  });

  it('결제 승인 금액이 요청 금액과 다르면 도메인 에러를 던진다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const payment = PaymentModel.request({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      provider: 'LOCAL',
      amount: 15000,
      now: createdAt,
    }).setPersistence('payment-1', createdAt, createdAt);

    expect(() =>
      payment.markApproving({
        providerPaymentId: 'local-payment-1',
        amount: 10000,
        now: new Date('2026-04-29T01:01:00.000Z'),
      }),
    ).toThrow(new DomainError(DomainErrorCode.PAYMENT_AMOUNT_MISMATCH));
  });

  it('결제 승인 후 예약 생성이 완료되면 APPROVED 상태로 전환한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const approvedAt = new Date('2026-04-29T01:02:00.000Z');
    const payment = PaymentModel.request({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      provider: 'LOCAL',
      amount: 15000,
      now: createdAt,
    }).setPersistence('payment-1', createdAt, createdAt);

    const approved = payment
      .markApproving({
        providerPaymentId: 'local-payment-1',
        amount: 15000,
        now: new Date('2026-04-29T01:01:00.000Z'),
      })
      .approve({ reservationId: 'reservation-1', now: approvedAt });

    expect(approved.status).toBe('APPROVED');
    expect(approved.providerPaymentId).toBe('local-payment-1');
    expect(approved.reservationId).toBe('reservation-1');
    expect(approved.approvedAt).toBe(approvedAt);
  });

  it('PG 승인 후 내부 후처리 실패 시 환불 필요 상태로 전환한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const payment = PaymentModel.request({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      provider: 'LOCAL',
      amount: 15000,
      now: createdAt,
    }).setPersistence('payment-1', createdAt, createdAt);

    const refundRequired = payment
      .markApproving({
        providerPaymentId: 'local-payment-1',
        amount: 15000,
        now: new Date('2026-04-29T01:01:00.000Z'),
      })
      .requireRefund({
        reason: 'reservation failed',
        now: new Date('2026-04-29T01:02:00.000Z'),
      });

    expect(refundRequired.status).toBe('REFUND_REQUIRED');
    expect(refundRequired.failureReason).toBe('reservation failed');
  });

  it('환불 요청이 성공하면 REFUNDED 상태로 전환한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const refundedAt = new Date('2026-04-29T01:03:00.000Z');
    const payment = PaymentModel.of({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-1',
      amount: 15000,
      status: 'REFUND_REQUIRED',
      requestedAt: createdAt,
      failureReason: 'reservation failed',
    }).setPersistence('payment-1', createdAt, createdAt);

    const refunded = payment
      .startRefund({ now: new Date('2026-04-29T01:02:00.000Z') })
      .completeRefund({ now: refundedAt });

    expect(refunded.status).toBe('REFUNDED');
    expect(refunded.refundedAt).toBe(refundedAt);
  });

  it('결제 완료된 예매를 취소하면 결제를 환불 필요 상태로 전환한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const now = new Date('2026-04-29T01:05:00.000Z');
    const payment = PaymentModel.of({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      reservationId: 'reservation-1',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-1',
      amount: 15000,
      status: 'APPROVED',
      requestedAt: createdAt,
      approvedAt: createdAt,
    }).setPersistence('payment-1', createdAt, createdAt);

    const refundRequired = payment.requestCancelRefund({ reason: 'user request', now });

    expect(refundRequired.status).toBe('REFUND_REQUIRED');
    expect(refundRequired.failureReason).toBe('user request');
    expect(refundRequired.updatedAt).toBe(now);
  });

  it('결제 멱등성 요청 해시가 다르면 중복 요청을 거부한다', () => {
    const payment = PaymentModel.request({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      provider: 'LOCAL',
      amount: 15000,
      now: new Date('2026-04-29T01:00:00.000Z'),
    });

    expect(() => payment.assertIdempotentRequestHash('different-hash')).toThrow(
      'PAYMENT_IDEMPOTENCY_KEY_CONFLICT',
    );
  });

  it('callback provider가 기존 결제 provider와 다르면 거부한다', () => {
    const payment = PaymentModel.request({
      memberId: '1',
      seatHoldId: '10',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      provider: 'LOCAL',
      amount: 15000,
      now: new Date('2026-04-29T01:00:00.000Z'),
    });

    expect(() => payment.assertProvider('KAKAO' as never)).toThrow('PAYMENT_PROVIDER_MISMATCH');
  });

  it('결제 이벤트 로그와 아웃박스 이벤트는 persistence 속성으로 생성한다', () => {
    const occurredAt = new Date('2026-04-29T01:00:00.000Z');
    const eventLog = PaymentEventLogModel.of({
      paymentId: 'payment-1',
      eventType: 'PAYMENT_REQUESTED',
      nextStatus: 'PENDING',
      provider: 'LOCAL',
      amount: 15000,
      metadata: { seatHoldId: '10' },
      occurredAt,
    });
    const outbox = OutboxEventModel.pending({
      aggregateType: 'PAYMENT',
      aggregateId: 'payment-1',
      eventType: 'PAYMENT_REQUESTED',
      payload: { paymentId: 'payment-1' },
      occurredAt,
    });

    expect(eventLog.paymentId).toBe('payment-1');
    expect(eventLog.eventType).toBe('PAYMENT_REQUESTED');
    expect(eventLog.metadata).toEqual({ seatHoldId: '10' });
    expect(outbox.aggregateType).toBe('PAYMENT');
    expect(outbox.status).toBe('PENDING');
    expect(outbox.retryCount).toBe(0);
  });

  it('내가 점유했고 결제 완료되지 않은 좌석 선점은 RELEASED 상태로 해제한다', () => {
    const createdAt = new Date('2026-04-28T09:00:00.000Z');
    const seatHold = SeatHoldModel.of({
      screeningId: '1',
      seatId: '2',
      memberId: '3',
      status: 'HELD',
      expiresAt: new Date('2026-04-28T09:13:00.000Z'),
    }).setPersistence('hold-1', createdAt, createdAt);

    const released = seatHold.release({ memberId: '3' });

    expect(released.id).toBe('hold-1');
    expect(released.status).toBe('RELEASED');
  });

  it('내가 점유했고 결제 전인 좌석 선점은 결제 요청에 사용할 수 있다', () => {
    const seatHold = SeatHoldModel.of({
      screeningId: '1',
      seatId: '2',
      memberId: '3',
      status: 'HELD',
      expiresAt: new Date('2026-04-28T09:13:00.000Z'),
    });

    expect(() => seatHold.assertPayableBy('3')).not.toThrow();
  });

  it('다른 회원의 좌석 선점은 결제 요청에 사용할 수 없다', () => {
    const seatHold = SeatHoldModel.of({
      screeningId: '1',
      seatId: '2',
      memberId: '3',
      status: 'HELD',
      expiresAt: new Date('2026-04-28T09:13:00.000Z'),
    });

    expect(() => seatHold.assertPayableBy('4')).toThrow('SEAT_HOLD_FORBIDDEN');
  });

  it('다른 회원의 좌석 선점은 해제할 수 없다', () => {
    const createdAt = new Date('2026-04-28T09:00:00.000Z');
    const seatHold = SeatHoldModel.of({
      screeningId: '1',
      seatId: '2',
      memberId: '3',
      status: 'HELD',
      expiresAt: new Date('2026-04-28T09:13:00.000Z'),
    }).setPersistence('hold-1', createdAt, createdAt);

    expect(() => seatHold.release({ memberId: '4' })).toThrow('SEAT_HOLD_FORBIDDEN');
  });

  it('결제 완료되어 예약과 연결된 좌석 선점은 해제할 수 없다', () => {
    const createdAt = new Date('2026-04-28T09:00:00.000Z');
    const seatHold = SeatHoldModel.of({
      screeningId: '1',
      seatId: '2',
      memberId: '3',
      reservationId: '4',
      status: 'CONFIRMED',
      expiresAt: new Date('2026-04-28T09:13:00.000Z'),
    }).setPersistence('hold-1', createdAt, createdAt);

    expect(() => seatHold.release({ memberId: '3' })).toThrow('SEAT_HOLD_PAYMENT_COMPLETED');
  });

  it('결제 완료 시 좌석 선점을 CONFIRMED 상태로 예약과 연결한다', () => {
    const createdAt = new Date('2026-04-28T09:00:00.000Z');
    const now = new Date('2026-04-28T09:03:00.000Z');
    const seatHold = SeatHoldModel.of({
      screeningId: '1',
      seatId: '2',
      memberId: '3',
      status: 'HELD',
      expiresAt: new Date('2026-04-28T09:13:00.000Z'),
    }).setPersistence('hold-1', createdAt, createdAt);

    const confirmed = seatHold.confirm({ reservationId: 'reservation-1', now });

    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.reservationId).toBe('reservation-1');
    expect(confirmed.updatedAt).toBe(now);
  });

  it('휴대전화 인증을 발급한 뒤 올바른 코드로 인증을 완료한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const now = new Date('2026-04-28T00:01:00.000Z');
    const verification = PhoneVerificationModel.issue({
      phoneNumber: '01000000000',
      code: '123456',
      expiresAt: new Date('2026-04-28T00:05:00.000Z'),
    }).setPersistence('verification-1', createdAt, createdAt);

    const confirmed = verification.confirm({
      phoneNumber: '01000000000',
      code: '123456',
      now,
    });

    expect(confirmed.id).toBe('verification-1');
    expect(confirmed.status).toBe('VERIFIED');
    expect(confirmed.verifiedAt).toBe(now);
  });

  it('refresh token을 폐기하면 revokedAt을 기록한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const now = new Date('2026-04-28T00:10:00.000Z');
    const refreshToken = RefreshTokenModel.issue({
      memberId: 'member-1',
      token: 'refresh-token-0001',
      expiresAt: new Date('2026-05-12T00:00:00.000Z'),
    }).setPersistence('refresh-token-1', createdAt, createdAt);

    const revoked = refreshToken.revoke(now);

    expect(revoked.memberId).toBe('member-1');
    expect(revoked.token).toBe('refresh-token-0001');
    expect(revoked.revokedAt).toBe(now);
    expect(revoked.updatedAt).toBe(now);
  });

  it('만료된 휴대전화 인증 코드를 확인하면 도메인 에러를 던진다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const verification = PhoneVerificationModel.issue({
      phoneNumber: '01000000000',
      code: '123456',
      expiresAt: new Date('2026-04-28T00:05:00.000Z'),
    }).setPersistence('verification-1', createdAt, createdAt);

    expect(() =>
      verification.confirm({
        phoneNumber: '01000000000',
        code: '123456',
        now: new Date('2026-04-28T00:05:00.000Z'),
      }),
    ).toThrow(new DomainError(DomainErrorCode.PHONE_VERIFICATION_EXPIRED));
  });
});
