import { Logging } from '@kangjuhyup/rvlog';
import { ReleaseSeatHoldCommand, SeatHoldReleasedDto } from '../dto';
import type { SeatHoldCachePort, SeatHoldRepositoryPort } from '../ports';

@Logging
export class ReleaseSeatHoldCommandHandler {
  constructor(
    private readonly seatHoldRepository: SeatHoldRepositoryPort,
    private readonly seatHoldCache: SeatHoldCachePort,
  ) {}

  async execute(command: ReleaseSeatHoldCommand): Promise<SeatHoldReleasedDto> {
    const hold = await this.seatHoldRepository.findById(command.holdId);

    if (hold === undefined) {
      throw new Error('SEAT_HOLD_NOT_FOUND');
    }

    const released = hold.release({ memberId: command.memberId });
    await this.seatHoldRepository.save(released);
    await this.seatHoldCache.release(released.screeningId, released.seatId);

    return SeatHoldReleasedDto.of({
      holdId: released.id,
      released: true,
    });
  }
}
