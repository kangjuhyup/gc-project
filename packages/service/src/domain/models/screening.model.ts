import { PersistenceModel } from '@domain/shared';

export interface ScreeningPersistenceProps {
  readonly movieId: string;
  readonly screenId: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly price: number;
}

export class ScreeningModel extends PersistenceModel<string, ScreeningPersistenceProps> {
  private constructor(props: ScreeningPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: ScreeningPersistenceProps): ScreeningModel {
    return new ScreeningModel(props);
  }

  get movieId(): string {
    return this.etc.movieId;
  }

  get screenId(): string {
    return this.etc.screenId;
  }

  get startAt(): Date {
    return this.etc.startAt;
  }

  get endAt(): Date {
    return this.etc.endAt;
  }

  get price(): number {
    return this.etc.price;
  }
}
