import { describe, expect, it } from 'vitest';
import {
  DomainError,
  DomainErrorCode,
  MemberModel,
  MovieImageModel,
  MovieModel,
  PhoneVerificationModel,
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
