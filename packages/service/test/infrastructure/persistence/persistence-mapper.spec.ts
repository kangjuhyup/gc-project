import { describe, expect, it } from 'vitest';
import {
  MovieImageModel,
  OutboxEventModel,
  PaymentEventLogModel,
  PaymentModel,
  PhoneVerificationModel,
  ReservationModel,
  ScreenModel,
  SeatHoldModel,
  TheaterModel,
} from '@domain';
import { MemberEntity } from '@infrastructure/persistence/entities/member.entity';
import { MovieEntity } from '@infrastructure/persistence/entities/movie.entity';
import { MovieImageEntity } from '@infrastructure/persistence/entities/movie-image.entity';
import { OutboxEventEntity } from '@infrastructure/persistence/entities/outbox-event.entity';
import { PaymentEntity } from '@infrastructure/persistence/entities/payment.entity';
import { PaymentEventLogEntity } from '@infrastructure/persistence/entities/payment-event-log.entity';
import { PhoneVerificationEntity } from '@infrastructure/persistence/entities/phone-verification.entity';
import { ReservationEntity } from '@infrastructure/persistence/entities/reservation.entity';
import { ScreeningEntity } from '@infrastructure/persistence/entities/screening.entity';
import { SeatHoldEntity } from '@infrastructure/persistence/entities/seat-hold.entity';
import { SeatEntity } from '@infrastructure/persistence/entities/seat.entity';
import { TheaterEntity } from '@infrastructure/persistence/entities/theater.entity';
import { PersistenceMapper } from '@infrastructure/persistence/mappers';

describe('PersistenceMapper', () => {
  it('회원 entity를 도메인으로 변환한 뒤 다시 entity로 변환한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const updatedAt = new Date('2026-04-28T01:00:00.000Z');
    const birthDate = new Date('1990-01-01T00:00:00.000Z');
    const entity = new MemberEntity();
    entity.id = '1';
    entity.userId = 'member_01';
    entity.passwordHash = 'hashed-password';
    entity.name = 'Member';
    entity.birthDate = birthDate;
    entity.phoneNumber = '01000000000';
    entity.address = 'Seoul';
    entity.status = 'ACTIVE';
    entity.failedLoginCount = 2;
    entity.createdAt = createdAt;
    entity.updatedAt = updatedAt;

    const model = PersistenceMapper.memberToDomain(entity);
    const mappedEntity = PersistenceMapper.memberToEntity(model);

    expect(model.id).toBe('1');
    expect(model.userId).toBe('member_01');
    expect(model.birthDate).toBe(birthDate);
    expect(model.phoneNumber).toBe('01000000000');
    expect(model.createdAt).toBe(createdAt);
    expect(model.updatedAt).toBe(updatedAt);
    expect(mappedEntity.id).toBe('1');
    expect(mappedEntity.userId).toBe('member_01');
    expect(mappedEntity.passwordHash).toBe('hashed-password');
    expect(mappedEntity.phoneNumber).toBe('01000000000');
    expect(mappedEntity.status).toBe('ACTIVE');
    expect(mappedEntity.failedLoginCount).toBe(2);
  });

  it('예약 모델을 entity 참조로 변환한 뒤 도메인 id로 복원한다', () => {
    const createdAt = new Date('2026-04-28T02:00:00.000Z');
    const model = ReservationModel.of({
      reservationNumber: 'R20260428001',
      memberId: '10',
      screeningId: '20',
      status: 'CONFIRMED',
      totalPrice: 24000,
    }).setPersistence('30', createdAt, createdAt);

    const entity = PersistenceMapper.reservationToEntity(model);
    const mappedModel = PersistenceMapper.reservationToDomain(entity);

    expect(entity.id).toBe('30');
    expect(entity.member.id).toBe('10');
    expect(entity.screening.id).toBe('20');
    expect(entity.reservationNumber).toBe('R20260428001');
    expect(mappedModel.id).toBe('30');
    expect(mappedModel.memberId).toBe('10');
    expect(mappedModel.screeningId).toBe('20');
    expect(mappedModel.status).toBe('CONFIRMED');
  });

  it('휴대전화 인증 모델을 entity로 변환한 뒤 다시 도메인으로 변환한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const updatedAt = new Date('2026-04-28T00:01:00.000Z');
    const expiresAt = new Date('2026-04-28T00:05:00.000Z');
    const model = PhoneVerificationModel.of({
      phoneNumber: '01000000000',
      code: '123456',
      status: 'VERIFIED',
      expiresAt,
      verifiedAt: updatedAt,
    }).setPersistence('verification-1', createdAt, updatedAt);

    const entity = PersistenceMapper.phoneVerificationToEntity(model);
    const mappedModel = PersistenceMapper.phoneVerificationToDomain(entity);

    expect(entity).toBeInstanceOf(PhoneVerificationEntity);
    expect(entity.id).toBe('verification-1');
    expect(entity.phoneNumber).toBe('01000000000');
    expect(entity.status).toBe('VERIFIED');
    expect(mappedModel.id).toBe('verification-1');
    expect(mappedModel.code).toBe('123456');
    expect(mappedModel.verifiedAt).toBe(updatedAt);
  });

  it('영화 이미지 entity를 도메인으로 변환한 뒤 다시 entity로 변환한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const entity = new MovieImageEntity();
    entity.id = '10';
    entity.movie = { id: '1' } as MovieEntity;
    entity.imageType = 'POSTER';
    entity.url = 'https://example.com/poster.jpg';
    entity.sortOrder = 0;
    entity.createdAt = createdAt;

    const model = PersistenceMapper.movieImageToDomain(entity);
    const mappedEntity = PersistenceMapper.movieImageToEntity(model);

    expect(model).toBeInstanceOf(MovieImageModel);
    expect(model.movieId).toBe('1');
    expect(model.imageType).toBe('POSTER');
    expect(mappedEntity.movie.id).toBe('1');
    expect(mappedEntity.url).toBe('https://example.com/poster.jpg');
  });

  it('극장과 상영관 entity를 도메인으로 변환한 뒤 다시 entity로 변환한다', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const theaterEntity = new TheaterEntity();
    theaterEntity.id = '1';
    theaterEntity.name = 'GC 시네마 강남';
    theaterEntity.address = '서울특별시 강남구 테헤란로 427';
    theaterEntity.latitude = 37.5065;
    theaterEntity.longitude = 127.053;
    theaterEntity.createdAt = createdAt;

    const theaterModel = PersistenceMapper.theaterToDomain(theaterEntity);
    const mappedTheater = PersistenceMapper.theaterToEntity(theaterModel);
    const screenModel = ScreenModel.of({
      theaterId: theaterModel.id,
      name: 'IMAX',
      totalSeats: 100,
    }).setPersistence('2', createdAt, createdAt);
    const screenEntity = PersistenceMapper.screenToEntity(screenModel);
    screenEntity.theater = theaterEntity;
    const mappedScreen = PersistenceMapper.screenToDomain(screenEntity);

    expect(theaterModel).toBeInstanceOf(TheaterModel);
    expect(mappedTheater.id).toBe('1');
    expect(mappedTheater.name).toBe('GC 시네마 강남');
    expect(mappedTheater.latitude).toBe(37.5065);
    expect(mappedTheater.longitude).toBe(127.053);
    expect(screenEntity.theater.id).toBe('1');
    expect(mappedScreen.theaterId).toBe('1');
    expect(mappedScreen.name).toBe('IMAX');
  });

  it('선택적 예약 참조가 있는 좌석 선점 entity를 도메인으로 변환한다', () => {
    const createdAt = new Date('2026-04-28T03:00:00.000Z');
    const updatedAt = new Date('2026-04-28T03:01:00.000Z');
    const expiresAt = new Date('2026-04-28T03:05:00.000Z');
    const entity = new SeatHoldEntity();
    entity.id = '1';
    entity.screening = { id: '2' } as ScreeningEntity;
    entity.seat = { id: '3' } as SeatEntity;
    entity.member = { id: '4' } as MemberEntity;
    entity.reservation = { id: '5' } as ReservationEntity;
    entity.status = 'HELD';
    entity.expiresAt = expiresAt;
    entity.createdAt = createdAt;
    entity.updatedAt = updatedAt;

    const model = PersistenceMapper.seatHoldToDomain(entity);

    expect(model.id).toBe('1');
    expect(model.screeningId).toBe('2');
    expect(model.seatId).toBe('3');
    expect(model.memberId).toBe('4');
    expect(model.reservationId).toBe('5');
    expect(model.status).toBe('HELD');
    expect(model.expiresAt).toBe(expiresAt);
    expect(model.createdAt).toBe(createdAt);
    expect(model.updatedAt).toBe(updatedAt);
  });

  it('좌석 선점 모델을 entity 참조로 변환한다', () => {
    const createdAt = new Date('2026-04-28T03:00:00.000Z');
    const updatedAt = new Date('2026-04-28T03:01:00.000Z');
    const expiresAt = new Date('2026-04-28T03:05:00.000Z');
    const model = SeatHoldModel.of({
      screeningId: '2',
      seatId: '3',
      memberId: '4',
      reservationId: '5',
      status: 'HELD',
      expiresAt,
    }).setPersistence('1', createdAt, updatedAt);

    const entity = PersistenceMapper.seatHoldToEntity(model);

    expect(entity.id).toBe('1');
    expect(entity.screening.id).toBe('2');
    expect(entity.seat.id).toBe('3');
    expect(entity.member.id).toBe('4');
    expect(entity.reservation?.id).toBe('5');
    expect(entity.status).toBe('HELD');
    expect(entity.expiresAt).toBe(expiresAt);
    expect(entity.createdAt).toBe(createdAt);
    expect(entity.updatedAt).toBe(updatedAt);
  });

  it('결제 모델을 entity 참조로 변환한 뒤 다시 도메인으로 변환한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const updatedAt = new Date('2026-04-29T01:01:00.000Z');
    const requestedAt = new Date('2026-04-29T01:00:00.000Z');
    const model = PaymentModel.of({
      memberId: '1',
      seatHoldId: '2',
      idempotencyKey: 'pay-test-key',
      requestHash: 'request-hash',
      reservationId: '3',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-1',
      amount: 15000,
      status: 'APPROVED',
      requestedAt,
      approvedAt: updatedAt,
    }).setPersistence('4', createdAt, updatedAt);

    const entity = PersistenceMapper.paymentToEntity(model);
    const mappedModel = PersistenceMapper.paymentToDomain(entity);

    expect(entity).toBeInstanceOf(PaymentEntity);
    expect(entity.id).toBe('4');
    expect(entity.member.id).toBe('1');
    expect(entity.seatHold.id).toBe('2');
    expect(entity.idempotencyKey).toBe('pay-test-key');
    expect(entity.requestHash).toBe('request-hash');
    expect(entity.reservation?.id).toBe('3');
    expect(entity.provider).toBe('LOCAL');
    expect(mappedModel).toBeInstanceOf(PaymentModel);
    expect(mappedModel.idempotencyKey).toBe('pay-test-key');
    expect(mappedModel.requestHash).toBe('request-hash');
    expect(mappedModel.providerPaymentId).toBe('local-payment-1');
    expect(mappedModel.status).toBe('APPROVED');
    expect(mappedModel.approvedAt).toBe(updatedAt);
  });

  it('결제 이벤트 로그 모델을 entity로 변환한 뒤 다시 도메인으로 변환한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const model = PaymentEventLogModel.of({
      paymentId: '4',
      eventType: 'PAYMENT_APPROVED',
      previousStatus: 'APPROVING',
      nextStatus: 'APPROVED',
      provider: 'LOCAL',
      providerPaymentId: 'local-payment-1',
      amount: 15000,
      metadata: { reservationId: '3' },
      occurredAt: createdAt,
    }).setPersistence('5', createdAt, createdAt);

    const entity = PersistenceMapper.paymentEventLogToEntity(model);
    const mappedModel = PersistenceMapper.paymentEventLogToDomain(entity);

    expect(entity).toBeInstanceOf(PaymentEventLogEntity);
    expect(entity.payment.id).toBe('4');
    expect(entity.eventType).toBe('PAYMENT_APPROVED');
    expect(mappedModel).toBeInstanceOf(PaymentEventLogModel);
    expect(mappedModel.previousStatus).toBe('APPROVING');
    expect(mappedModel.metadata).toEqual({ reservationId: '3' });
  });

  it('아웃박스 이벤트 모델을 entity로 변환한 뒤 다시 도메인으로 변환한다', () => {
    const createdAt = new Date('2026-04-29T01:00:00.000Z');
    const model = OutboxEventModel.pending({
      aggregateType: 'PAYMENT',
      aggregateId: '4',
      eventType: 'PAYMENT_REFUND_REQUESTED',
      payload: { paymentId: '4' },
      occurredAt: createdAt,
    }).setPersistence('6', createdAt, createdAt);

    const entity = PersistenceMapper.outboxEventToEntity(model);
    const mappedModel = PersistenceMapper.outboxEventToDomain(entity);

    expect(entity).toBeInstanceOf(OutboxEventEntity);
    expect(entity.aggregateType).toBe('PAYMENT');
    expect(entity.payload).toEqual({ paymentId: '4' });
    expect(mappedModel).toBeInstanceOf(OutboxEventModel);
    expect(mappedModel.eventType).toBe('PAYMENT_REFUND_REQUESTED');
    expect(mappedModel.status).toBe('PENDING');
  });
});
