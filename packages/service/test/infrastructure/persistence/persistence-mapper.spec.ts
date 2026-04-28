import { describe, expect, it } from 'vitest';
import { ReservationModel, SeatHoldModel } from '../../../src/domain';
import { MemberEntity } from '../../../src/infrastructure/persistence/entities/member.entity';
import { ReservationEntity } from '../../../src/infrastructure/persistence/entities/reservation.entity';
import { ScreeningEntity } from '../../../src/infrastructure/persistence/entities/screening.entity';
import { SeatHoldEntity } from '../../../src/infrastructure/persistence/entities/seat-hold.entity';
import { SeatEntity } from '../../../src/infrastructure/persistence/entities/seat.entity';
import { PersistenceMapper } from '../../../src/infrastructure/persistence/mappers';

describe('PersistenceMapper', () => {
  it('maps member entity to domain and back to entity', () => {
    const createdAt = new Date('2026-04-28T00:00:00.000Z');
    const updatedAt = new Date('2026-04-28T01:00:00.000Z');
    const birthDate = new Date('1990-01-01T00:00:00.000Z');
    const entity = new MemberEntity();
    entity.id = '1';
    entity.userId = 'member_01';
    entity.name = 'Member';
    entity.birthDate = birthDate;
    entity.phoneNumber = '01000000000';
    entity.address = 'Seoul';
    entity.status = 'ACTIVE';
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
    expect(mappedEntity.phoneNumber).toBe('01000000000');
    expect(mappedEntity.status).toBe('ACTIVE');
  });

  it('maps reservation model to entity references and back to domain ids', () => {
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

  it('maps seat hold entity with optional reservation to domain', () => {
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

  it('maps seat hold model to entity references', () => {
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
});
