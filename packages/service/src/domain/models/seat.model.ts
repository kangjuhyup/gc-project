import { PersistenceModel } from '@domain/shared';
import type { SeatTypeType } from '@domain/property';

export interface SeatPersistenceProps {
  readonly screenId: string;
  readonly seatRow: string;
  readonly seatCol: number;
  readonly seatType?: SeatTypeType;
}

export class SeatModel extends PersistenceModel<string, SeatPersistenceProps> {
  private constructor(props: SeatPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: SeatPersistenceProps): SeatModel {
    return new SeatModel(props);
  }

  get screenId(): string {
    return this.etc.screenId;
  }

  get seatRow(): string {
    return this.etc.seatRow;
  }

  get seatCol(): number {
    return this.etc.seatCol;
  }

  get seatType(): SeatTypeType | undefined {
    return this.etc.seatType;
  }
}
