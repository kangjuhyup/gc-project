import { PersistenceModel } from '../shared';

export type MovieRating = 'ALL' | '12' | '15' | '19';

export interface MoviePersistenceProps {
  readonly title: string;
  readonly director?: string;
  readonly genre?: string;
  readonly runningTime: number;
  readonly rating?: MovieRating;
  readonly releaseDate?: Date;
  readonly posterUrl?: string;
  readonly description?: string;
}

export class MovieModel extends PersistenceModel<string, MoviePersistenceProps> {
  private constructor(props: MoviePersistenceProps, id?: string) {
    super(props, id);
  }

  static of(props: MoviePersistenceProps): MovieModel {
    return new MovieModel(props);
  }

  get title(): string {
    return this.etc.title;
  }

  get director(): string | undefined {
    return this.etc.director;
  }

  get genre(): string | undefined {
    return this.etc.genre;
  }

  get runningTime(): number {
    return this.etc.runningTime;
  }

  get rating(): MovieRating | undefined {
    return this.etc.rating;
  }

  get releaseDate(): Date | undefined {
    return this.etc.releaseDate;
  }

  get posterUrl(): string | undefined {
    return this.etc.posterUrl;
  }

  get description(): string | undefined {
    return this.etc.description;
  }
}
