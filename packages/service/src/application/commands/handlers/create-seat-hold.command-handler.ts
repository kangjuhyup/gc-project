import { Logging } from '@kangjuhyup/rvlog';
import { SeatHoldModel, SeatHoldStatus } from '@domain';
import { assertDefined, assertNonEmpty, assertTrue } from '@application/assertions';
import { CreateSeatHoldCommand, SeatHoldCreatedDto } from '../dto';
import { Transactional } from '../decorators';
import type {
  ClockPort,
  SeatHoldCachePort,
  SeatHoldLock,
  SeatHoldLockPort,
  SeatHoldRepositoryPort,
} from '../ports';

const DEFAULT_SEAT_HOLD_TTL_SECONDS = 3;
const SEAT_HOLD_LOCK_TTL_MILLISECONDS = 3000;

export interface SeatHoldTtlOptions {
  readonly ttlSeconds: number;
}

@Logging
export class CreateSeatHoldCommandHandler {
  constructor(
    private readonly seatHoldRepository: SeatHoldRepositoryPort,
    private readonly seatHoldCache: SeatHoldCachePort,
    private readonly seatHoldLock: SeatHoldLockPort,
    private readonly clock: ClockPort,
    private readonly ttlOptions: SeatHoldTtlOptions = { ttlSeconds: DEFAULT_SEAT_HOLD_TTL_SECONDS },
  ) {}

  @Transactional()
  async execute(command: CreateSeatHoldCommand): Promise<SeatHoldCreatedDto> {
    const seatIds = this.uniqueSeatIds(command.seatIds);
    const lock = await this.acquireLock(command.screeningId, seatIds);
    const cachedHolds: SeatHoldModel[] = [];

    try {
      const now = this.clock.now();
      const expiresAt = new Date(now.getTime() + this.ttlOptions.ttlSeconds * 1000);

      await this.ensureSeatsBelongToScreening(command.screeningId, seatIds);
      await this.ensureSeatsAvailable(command.screeningId, seatIds, now);

      const holds = seatIds.map((seatId) =>
        SeatHoldModel.of({
          screeningId: command.screeningId,
          seatId,
          memberId: command.memberId,
          status: SeatHoldStatus.HELD,
          expiresAt,
        }),
      );
      for (const hold of holds) {
        const cached = await this.seatHoldCache.hold(hold, this.ttlOptions.ttlSeconds);
        assertTrue(cached, () => new Error('SEAT_ALREADY_HELD'));

        cachedHolds.push(hold);
      }

      const savedHolds = await this.seatHoldRepository.saveMany(holds);

      return SeatHoldCreatedDto.of({
        screeningId: command.screeningId,
        seatIds,
        holdIds: savedHolds.map((hold) => hold.id),
        ttlSeconds: this.ttlOptions.ttlSeconds,
        expiresAt,
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
    assertDefined(lock, () => new Error('SEAT_ALREADY_HELD'));

    return lock;
  }

  private uniqueSeatIds(seatIds: string[]): string[] {
    const unique = [...new Set(seatIds)];
    assertNonEmpty(unique, () => new Error('INVALID_SEAT_HOLD_REQUEST'));
    assertTrue(unique.length === seatIds.length, () => new Error('INVALID_SEAT_HOLD_REQUEST'));

    return unique;
  }

  private async ensureSeatsBelongToScreening(screeningId: string, seatIds: string[]): Promise<void> {
    const matchedSeatIds = await this.seatHoldRepository.findSeatIdsInScreening({ screeningId, seatIds });
    assertTrue(matchedSeatIds.length === seatIds.length, () => new Error('SEAT_NOT_FOUND'));
  }

  private async ensureSeatsAvailable(screeningId: string, seatIds: string[], now: Date): Promise<void> {
    const unavailableSeatIds = await this.seatHoldRepository.findUnavailableSeatIds({
      screeningId,
      seatIds,
      now,
    });
    assertTrue(unavailableSeatIds.length === 0, () => new Error('SEAT_ALREADY_HELD'));
  }
}
