import { PersistenceModel } from '../shared';

export interface ScreenPersistenceProps {
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

  get name(): string {
    return this.etc.name;
  }

  get totalSeats(): number {
    return this.etc.totalSeats;
  }
}
