import { PersistenceModel } from '@domain/shared';
import type { MovieImageTypeType } from '@domain/property';

export interface MovieImagePersistenceProps {
  readonly movieId: string;
  readonly imageType: MovieImageTypeType;
  readonly url: string;
  readonly sortOrder: number;
}

export class MovieImageModel extends PersistenceModel<string, MovieImagePersistenceProps> {
  private constructor(props: MovieImagePersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: MovieImagePersistenceProps): MovieImageModel {
    return new MovieImageModel(props);
  }

  get movieId(): string {
    return this.etc.movieId;
  }

  get imageType(): MovieImageTypeType {
    return this.etc.imageType;
  }

  get url(): string {
    return this.etc.url;
  }

  get sortOrder(): number {
    return this.etc.sortOrder;
  }
}
