import type { Rel } from '@mikro-orm/core';
import {
  MemberModel,
  MovieImageModel,
  MovieModel,
  OutboxEventModel,
  PaymentEventLogModel,
  PaymentModel,
  PhoneVerificationModel,
  ReservationEventModel,
  ReservationModel,
  ReservationSeatModel,
  ScreenModel,
  ScreeningModel,
  SeatHoldModel,
  SeatModel,
  TheaterModel,
  type MemberStatusType,
  type MovieImageTypeType,
  type MovieRatingType,
  type OutboxStatusType,
  type PaymentEventTypeType,
  type PaymentProviderType,
  type PaymentStatusType,
  type PhoneVerificationStatusType,
  type ReservationEventTypeType,
  type ReservationStatusType,
  type SeatHoldStatusType,
  type SeatTypeType,
} from '@domain';
import { MemberEntity } from '../entities/member.entity';
import { MovieImageEntity } from '../entities/movie-image.entity';
import { MovieEntity } from '../entities/movie.entity';
import { OutboxEventEntity } from '../entities/outbox-event.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentEventLogEntity } from '../entities/payment-event-log.entity';
import { PhoneVerificationEntity } from '../entities/phone-verification.entity';
import { ReservationEventEntity } from '../entities/reservation-event.entity';
import { ReservationSeatEntity } from '../entities/reservation-seat.entity';
import { ReservationEntity } from '../entities/reservation.entity';
import { ScreenEntity } from '../entities/screen.entity';
import { ScreeningEntity } from '../entities/screening.entity';
import { SeatHoldEntity } from '../entities/seat-hold.entity';
import { SeatEntity } from '../entities/seat.entity';
import { TheaterEntity } from '../entities/theater.entity';

const EPOCH = new Date(0);

function ref<T extends { id: string }>(id: string): Rel<T> {
  return { id } as Rel<T>;
}

function assignId<T extends { id: string }>(entity: T, id: string | undefined): T {
  if (id !== undefined) {
    entity.id = id;
  }
  return entity;
}

function currentId(id: string): string | undefined {
  return id === undefined ? undefined : id;
}

export class PersistenceMapper {
  static memberToDomain(entity: MemberEntity): MemberModel {
    return MemberModel.of({
      userId: entity.userId,
      passwordHash: entity.passwordHash,
      name: entity.name,
      birthDate: entity.birthDate,
      phoneNumber: entity.phoneNumber,
      address: entity.address,
      status: entity.status as MemberStatusType,
      failedLoginCount: entity.failedLoginCount,
      lockedAt: entity.lockedAt,
    }).setPersistence(entity.id, entity.createdAt, entity.updatedAt);
  }

  static memberToEntity(model: MemberModel): MemberEntity {
    const entity = assignId(new MemberEntity(), currentId(model.id));
    entity.userId = model.userId;
    entity.passwordHash = model.passwordHash;
    entity.name = model.name;
    entity.birthDate = model.birthDate;
    entity.phoneNumber = model.phoneNumber;
    entity.address = model.address;
    entity.status = model.status;
    entity.failedLoginCount = model.failedLoginCount;
    entity.lockedAt = model.lockedAt;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    if (model.updatedAt !== undefined) {
      entity.updatedAt = model.updatedAt;
    }
    return entity;
  }

  static movieToDomain(entity: MovieEntity): MovieModel {
    return MovieModel.of({
      title: entity.title,
      director: entity.director,
      genre: entity.genre,
      runningTime: entity.runningTime,
      rating: entity.rating as MovieRatingType | undefined,
      releaseDate: entity.releaseDate,
      posterUrl: entity.posterUrl,
      description: entity.description,
    }).setPersistence(entity.id, entity.createdAt, entity.createdAt);
  }

  static movieToEntity(model: MovieModel): MovieEntity {
    const entity = assignId(new MovieEntity(), currentId(model.id));
    entity.title = model.title;
    entity.director = model.director;
    entity.genre = model.genre;
    entity.runningTime = model.runningTime;
    entity.rating = model.rating;
    entity.releaseDate = model.releaseDate;
    entity.posterUrl = model.posterUrl;
    entity.description = model.description;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    return entity;
  }

  static movieImageToDomain(entity: MovieImageEntity): MovieImageModel {
    return MovieImageModel.of({
      movieId: entity.movie.id,
      imageType: entity.imageType as MovieImageTypeType,
      url: entity.url,
      sortOrder: entity.sortOrder,
    }).setPersistence(entity.id, entity.createdAt, entity.createdAt);
  }

  static movieImageToEntity(model: MovieImageModel): MovieImageEntity {
    const entity = assignId(new MovieImageEntity(), currentId(model.id));
    entity.movie = ref<MovieEntity>(model.movieId);
    entity.imageType = model.imageType;
    entity.url = model.url;
    entity.sortOrder = model.sortOrder;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    return entity;
  }

  static phoneVerificationToDomain(entity: PhoneVerificationEntity): PhoneVerificationModel {
    return PhoneVerificationModel.of({
      phoneNumber: entity.phoneNumber,
      code: entity.code,
      status: entity.status as PhoneVerificationStatusType,
      expiresAt: entity.expiresAt,
      verifiedAt: entity.verifiedAt,
    }).setPersistence(entity.id, entity.createdAt, entity.updatedAt);
  }

  static phoneVerificationToEntity(model: PhoneVerificationModel): PhoneVerificationEntity {
    const entity = assignId(new PhoneVerificationEntity(), currentId(model.id));
    entity.phoneNumber = model.phoneNumber;
    entity.code = model.code;
    entity.status = model.status;
    entity.expiresAt = model.expiresAt;
    entity.verifiedAt = model.verifiedAt;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    if (model.updatedAt !== undefined) {
      entity.updatedAt = model.updatedAt;
    }
    return entity;
  }

  static theaterToDomain(entity: TheaterEntity): TheaterModel {
    return TheaterModel.of({
      name: entity.name,
      address: entity.address,
      latitude: entity.latitude,
      longitude: entity.longitude,
    }).setPersistence(entity.id, entity.createdAt, entity.createdAt);
  }

  static theaterToEntity(model: TheaterModel): TheaterEntity {
    const entity = assignId(new TheaterEntity(), currentId(model.id));
    entity.name = model.name;
    entity.address = model.address;
    entity.latitude = model.latitude;
    entity.longitude = model.longitude;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    return entity;
  }

  static screenToDomain(entity: ScreenEntity): ScreenModel {
    return ScreenModel.of({
      theaterId: entity.theater.id,
      name: entity.name,
      totalSeats: entity.totalSeats,
    }).setPersistence(entity.id, EPOCH, EPOCH);
  }

  static screenToEntity(model: ScreenModel): ScreenEntity {
    const entity = assignId(new ScreenEntity(), currentId(model.id));
    entity.theater = ref<TheaterEntity>(model.theaterId);
    entity.name = model.name;
    entity.totalSeats = model.totalSeats;
    return entity;
  }

  static seatToDomain(entity: SeatEntity): SeatModel {
    return SeatModel.of({
      screenId: entity.screen.id,
      seatRow: entity.seatRow,
      seatCol: entity.seatCol,
      seatType: entity.seatType as SeatTypeType | undefined,
    }).setPersistence(entity.id, EPOCH, EPOCH);
  }

  static seatToEntity(model: SeatModel): SeatEntity {
    const entity = assignId(new SeatEntity(), currentId(model.id));
    entity.screen = ref<ScreenEntity>(model.screenId);
    entity.seatRow = model.seatRow;
    entity.seatCol = model.seatCol;
    entity.seatType = model.seatType;
    return entity;
  }

  static screeningToDomain(entity: ScreeningEntity): ScreeningModel {
    return ScreeningModel.of({
      movieId: entity.movie.id,
      screenId: entity.screen.id,
      startAt: entity.startAt,
      endAt: entity.endAt,
      price: entity.price,
    }).setPersistence(entity.id, EPOCH, EPOCH);
  }

  static screeningToEntity(model: ScreeningModel): ScreeningEntity {
    const entity = assignId(new ScreeningEntity(), currentId(model.id));
    entity.movie = ref<MovieEntity>(model.movieId);
    entity.screen = ref<ScreenEntity>(model.screenId);
    entity.startAt = model.startAt;
    entity.endAt = model.endAt;
    entity.price = model.price;
    return entity;
  }

  static reservationToDomain(entity: ReservationEntity): ReservationModel {
    return ReservationModel.of({
      reservationNumber: entity.reservationNumber,
      memberId: entity.member.id,
      screeningId: entity.screening.id,
      status: entity.status as ReservationStatusType,
      totalPrice: entity.totalPrice,
      canceledAt: entity.canceledAt,
      cancelReason: entity.cancelReason,
    }).setPersistence(entity.id, entity.createdAt, entity.createdAt);
  }

  static reservationToEntity(model: ReservationModel): ReservationEntity {
    const entity = assignId(new ReservationEntity(), currentId(model.id));
    entity.reservationNumber = model.reservationNumber;
    entity.member = ref<MemberEntity>(model.memberId);
    entity.screening = ref<ScreeningEntity>(model.screeningId);
    entity.status = model.status;
    entity.totalPrice = model.totalPrice;
    entity.canceledAt = model.canceledAt;
    entity.cancelReason = model.cancelReason;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    return entity;
  }

  static reservationSeatToDomain(entity: ReservationSeatEntity): ReservationSeatModel {
    return ReservationSeatModel.of({
      reservationId: entity.reservation.id,
      screeningId: entity.screening.id,
      seatId: entity.seat.id,
    }).setPersistence(entity.id, EPOCH, EPOCH);
  }

  static reservationSeatToEntity(model: ReservationSeatModel): ReservationSeatEntity {
    const entity = assignId(new ReservationSeatEntity(), currentId(model.id));
    entity.reservation = ref<ReservationEntity>(model.reservationId);
    entity.screening = ref<ScreeningEntity>(model.screeningId);
    entity.seat = ref<SeatEntity>(model.seatId);
    return entity;
  }

  static seatHoldToDomain(entity: SeatHoldEntity): SeatHoldModel {
    return SeatHoldModel.of({
      screeningId: entity.screening.id,
      seatId: entity.seat.id,
      memberId: entity.member.id,
      reservationId: entity.reservation?.id,
      status: entity.status as SeatHoldStatusType,
      expiresAt: entity.expiresAt,
    }).setPersistence(entity.id, entity.createdAt, entity.updatedAt);
  }

  static seatHoldToEntity(model: SeatHoldModel): SeatHoldEntity {
    const entity = assignId(new SeatHoldEntity(), currentId(model.id));
    entity.screening = ref<ScreeningEntity>(model.screeningId);
    entity.seat = ref<SeatEntity>(model.seatId);
    entity.member = ref<MemberEntity>(model.memberId);
    entity.reservation = model.reservationId === undefined ? undefined : ref<ReservationEntity>(model.reservationId);
    entity.status = model.status;
    entity.expiresAt = model.expiresAt;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    if (model.updatedAt !== undefined) {
      entity.updatedAt = model.updatedAt;
    }
    return entity;
  }

  static reservationEventToDomain(entity: ReservationEventEntity): ReservationEventModel {
    return ReservationEventModel.of({
      reservationId: entity.reservation.id,
      eventType: entity.eventType as ReservationEventTypeType,
      description: entity.description,
    }).setPersistence(entity.id, entity.createdAt, entity.createdAt);
  }

  static reservationEventToEntity(model: ReservationEventModel): ReservationEventEntity {
    const entity = assignId(new ReservationEventEntity(), currentId(model.id));
    entity.reservation = ref<ReservationEntity>(model.reservationId);
    entity.eventType = model.eventType;
    entity.description = model.description;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    return entity;
  }

  static paymentToDomain(entity: PaymentEntity): PaymentModel {
    return PaymentModel.of({
      memberId: entity.member.id,
      seatHoldId: entity.seatHold.id,
      idempotencyKey: entity.idempotencyKey,
      reservationId: entity.reservation?.id,
      provider: entity.provider as PaymentProviderType,
      providerPaymentId: entity.providerPaymentId,
      amount: entity.amount,
      status: entity.status as PaymentStatusType,
      requestedAt: entity.requestedAt,
      approvedAt: entity.approvedAt,
      failedAt: entity.failedAt,
      refundedAt: entity.refundedAt,
      failureReason: entity.failureReason,
    }).setPersistence(entity.id, entity.createdAt, entity.updatedAt);
  }

  static paymentToEntity(model: PaymentModel): PaymentEntity {
    const entity = assignId(new PaymentEntity(), currentId(model.id));
    entity.member = ref<MemberEntity>(model.memberId);
    entity.seatHold = ref<SeatHoldEntity>(model.seatHoldId);
    entity.idempotencyKey = model.idempotencyKey;
    entity.reservation = model.reservationId === undefined ? undefined : ref<ReservationEntity>(model.reservationId);
    entity.provider = model.provider;
    entity.providerPaymentId = model.providerPaymentId;
    entity.amount = model.amount;
    entity.status = model.status;
    entity.requestedAt = model.requestedAt;
    entity.approvedAt = model.approvedAt;
    entity.failedAt = model.failedAt;
    entity.refundedAt = model.refundedAt;
    entity.failureReason = model.failureReason;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    if (model.updatedAt !== undefined) {
      entity.updatedAt = model.updatedAt;
    }
    return entity;
  }

  static paymentEventLogToDomain(entity: PaymentEventLogEntity): PaymentEventLogModel {
    return PaymentEventLogModel.of({
      paymentId: entity.payment.id,
      eventType: entity.eventType as PaymentEventTypeType,
      previousStatus: entity.previousStatus as PaymentStatusType | undefined,
      nextStatus: entity.nextStatus as PaymentStatusType,
      provider: entity.provider as PaymentProviderType,
      providerPaymentId: entity.providerPaymentId,
      amount: entity.amount,
      reason: entity.reason,
      metadata: entity.metadata,
      occurredAt: entity.occurredAt,
    }).setPersistence(entity.id, entity.createdAt, entity.createdAt);
  }

  static paymentEventLogToEntity(model: PaymentEventLogModel): PaymentEventLogEntity {
    const entity = assignId(new PaymentEventLogEntity(), currentId(model.id));
    entity.payment = ref<PaymentEntity>(model.paymentId);
    entity.eventType = model.eventType;
    entity.previousStatus = model.previousStatus;
    entity.nextStatus = model.nextStatus;
    entity.provider = model.provider;
    entity.providerPaymentId = model.providerPaymentId;
    entity.amount = model.amount;
    entity.reason = model.reason;
    entity.metadata = model.metadata;
    entity.occurredAt = model.occurredAt;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    return entity;
  }

  static outboxEventToDomain(entity: OutboxEventEntity): OutboxEventModel {
    return OutboxEventModel.of({
      aggregateType: entity.aggregateType,
      aggregateId: entity.aggregateId,
      eventType: entity.eventType,
      payload: entity.payload,
      status: entity.status as OutboxStatusType,
      retryCount: entity.retryCount,
      nextRetryAt: entity.nextRetryAt,
      lockedUntil: entity.lockedUntil,
      lastError: entity.lastError,
      occurredAt: entity.occurredAt,
      publishedAt: entity.publishedAt,
    }).setPersistence(entity.id, entity.createdAt, entity.updatedAt);
  }

  static outboxEventToEntity(model: OutboxEventModel): OutboxEventEntity {
    const entity = assignId(new OutboxEventEntity(), currentId(model.id));
    entity.aggregateType = model.aggregateType;
    entity.aggregateId = model.aggregateId;
    entity.eventType = model.eventType;
    entity.payload = model.payload;
    entity.status = model.status;
    entity.retryCount = model.retryCount;
    entity.nextRetryAt = model.nextRetryAt;
    entity.lockedUntil = model.lockedUntil;
    entity.lastError = model.lastError;
    entity.occurredAt = model.occurredAt;
    entity.publishedAt = model.publishedAt;
    if (model.createdAt !== undefined) {
      entity.createdAt = model.createdAt;
    }
    if (model.updatedAt !== undefined) {
      entity.updatedAt = model.updatedAt;
    }
    return entity;
  }
}
