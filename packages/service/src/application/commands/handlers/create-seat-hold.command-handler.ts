import { SeatHoldModel, SeatHoldStatus } from '@domain';
import { CreateSeatHoldCommand, SeatHoldCreatedDto } from '../dto';
import type { ClockPort, SeatHoldCachePort, SeatHoldLock, SeatHoldLockPort, SeatHoldRepositoryPort } from '../ports';

const RESPONSE_HOLD_TTL_SECONDS = 10 * 60;
const ACTUAL_HOLD_TTL_SECONDS = 13 * 60;
const SEAT_HOLD_LOCK_TTL_MILLISECONDS = 3000;

export class CreateSeatHoldCommandHandler {
  constructor(
    private readonly seatHoldRepository: SeatHoldRepositoryPort,
    private readonly seatHoldCache: SeatHoldCachePort,
    private readonly seatHoldLock: SeatHoldLockPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: CreateSeatHoldCommand): Promise<SeatHoldCreatedDto> {
    const seatIds = this.uniqueSeatIds(command.seatIds);
    const lock = await this.acquireLock(command.screeningId, seatIds);
    const cachedHolds: SeatHoldModel[] = [];

    try {
      const now = this.clock.now();
      const responseExpiresAt = new Date(now.getTime() + RESPONSE_HOLD_TTL_SECONDS * 1000);
      const actualExpiresAt = new Date(now.getTime() + ACTUAL_HOLD_TTL_SECONDS * 1000);

      await this.ensureSeatsBelongToScreening(command.screeningId, seatIds);
      await this.ensureSeatsAvailable(command.screeningId, seatIds, now);

      const holds = seatIds.map((seatId) =>
        SeatHoldModel.of({
          screeningId: command.screeningId,
          seatId,
          memberId: command.memberId,
          status: SeatHoldStatus.HELD,
          expiresAt: actualExpiresAt,
        }),
      );
      for (const hold of holds) {
        const cached = await this.seatHoldCache.hold(hold, ACTUAL_HOLD_TTL_SECONDS);

        if (!cached) {
          throw new Error('SEAT_ALREADY_HELD');
        }

        cachedHolds.push(hold);
      }

      const savedHolds = await this.seatHoldRepository.saveMany(holds);

      return SeatHoldCreatedDto.of({
        screeningId: command.screeningId,
        seatIds,
        holdIds: savedHolds.map((hold) => hold.id),
        ttlSeconds: RESPONSE_HOLD_TTL_SECONDS,
        expiresAt: responseExpiresAt,
      });
    } catch (error) {
      await Promise.all(
        cachedHolds.map((hold) => this.seatHoldCache.release(hold.screeningId, hold.seatId)),
      );
      throw error;
    } finally {
      await this.seatHoldLock.release(lock);
    }
  }

  private async acquireLock(screeningId: string, seatIds: string[]): Promise<SeatHoldLock> {
    const lock = await this.seatHoldLock.acquire({
      screeningId,
      seatIds,
      ttlMilliseconds: SEAT_HOLD_LOCK_TTL_MILLISECONDS,
    });

    if (lock === undefined) {
      throw new Error('SEAT_ALREADY_HELD');
    }

    return lock;
  }

  private uniqueSeatIds(seatIds: string[]): string[] {
    const unique = [...new Set(seatIds)];

    if (unique.length === 0 || unique.length !== seatIds.length) {
      throw new Error('INVALID_SEAT_HOLD_REQUEST');
    }

    return unique;
  }

  private async ensureSeatsBelongToScreening(screeningId: string, seatIds: string[]): Promise<void> {
    const matchedSeatIds = await this.seatHoldRepository.findSeatIdsInScreening({ screeningId, seatIds });

    if (matchedSeatIds.length !== seatIds.length) {
      throw new Error('SEAT_NOT_FOUND');
    }
  }

  private async ensureSeatsAvailable(screeningId: string, seatIds: string[], now: Date): Promise<void> {
    const unavailableSeatIds = await this.seatHoldRepository.findUnavailableSeatIds({
      screeningId,
      seatIds,
      now,
    });

    if (unavailableSeatIds.length > 0) {
      throw new Error('SEAT_ALREADY_HELD');
    }
  }
}
