import { PersistenceModel } from '@domain/shared';

export interface ScreenPersistenceProps {
  readonly theaterId: string;
  readonly name: string;
  readonly totalSeats: number;
}

export class ScreenModel extends PersistenceModel<string, ScreenPersistenceProps> {
  private constructor(props: ScreenPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: ScreenPersistenceProps): ScreenModel {
    return new ScreenModel(props);
  }

  get theaterId(): string {
    return this.etc.theaterId;
  }

  get name(): string {
    return this.etc.name;
  }

  get totalSeats(): number {
    return this.etc.totalSeats;
  }
}
