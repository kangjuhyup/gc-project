import { PersistenceModel } from '@domain/shared';

export interface TheaterPersistenceProps {
  readonly name: string;
  readonly address: string;
}

export class TheaterModel extends PersistenceModel<string, TheaterPersistenceProps> {
  private constructor(props: TheaterPersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: TheaterPersistenceProps): TheaterModel {
    return new TheaterModel(props);
  }

  get name(): string {
    return this.etc.name;
  }

  get address(): string {
    return this.etc.address;
  }
}
