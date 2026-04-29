import { Search, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatScreeningTime } from './movieTimeline';
import { useMoviesPage } from './useMoviesPage';

export function MoviesPage() {
  const { filteredMovies, handleKeywordChange, keyword, moviesQuery, timelineGroups } =
    useMoviesPage();

  return (
    <section className="movie-page" aria-labelledby="movie-page-title">
      <header className="movie-page-header">
        <div>
          <p className="eyebrow">Now Showing</p>
          <h2 id="movie-page-title">영화 타임라인</h2>
        </div>
      </header>

      <div className="movie-toolbar">
        <label className="movie-search" htmlFor="movie-search">
          <Search size={18} aria-hidden="true" />
          <input
            id="movie-search"
            onChange={handleKeywordChange}
            placeholder="영화명, 장르, 관람등급 검색"
            type="search"
            value={keyword}
          />
        </label>
        <span className="movie-count">{filteredMovies.length}편</span>
      </div>

      {moviesQuery.isError ? (
        <p className="status-message" data-state="idle" role="status">
          영화 API 응답을 받지 못해 샘플 데이터를 표시합니다.
        </p>
      ) : null}

      {timelineGroups.length ? (
        <div className="timeline-list">
          {timelineGroups.map((group) => (
            <section className="timeline-group" key={group.dateKey} aria-labelledby={group.dateKey}>
              <h3 id={group.dateKey}>{group.label}</h3>
              <div className="movie-card-grid">
                {group.movies.map((movie) => (
                  <article className="movie-card" key={movie.id}>
                    <img alt={`${movie.title} 포스터`} src={movie.posterUrl} />
                    <div className="movie-card-body">
                      <div className="movie-card-title">
                        <span>{movie.rating}</span>
                        <h4>{movie.title}</h4>
                      </div>
                      <p>{movie.description}</p>
                      <dl className="movie-meta">
                        <div>
                          <dt>장르</dt>
                          <dd>{movie.genre}</dd>
                        </div>
                        <div>
                          <dt>상영시간</dt>
                          <dd>{movie.runningTime}분</dd>
                        </div>
                        <div>
                          <dt>다음 상영</dt>
                          <dd>
                            {formatScreeningTime(movie.nextScreening.startAt)} ·{' '}
                            {movie.nextScreening.screenName}
                          </dd>
                        </div>
                        <div>
                          <dt>잔여석</dt>
                          <dd>
                            {movie.nextScreening.remainingSeats}/{movie.nextScreening.totalSeats}
                          </dd>
                        </div>
                      </dl>
                      <Button asChild>
                        <Link
                          state={{
                            movieTitle: movie.title,
                            screenName: movie.nextScreening.screenName,
                            screeningEndAt: movie.nextScreening.endAt,
                            screeningStartAt: movie.nextScreening.startAt,
                          }}
                          to={`/movies/${movie.id}/screenings/${movie.nextScreening.id}/seats`}
                          viewTransition
                        >
                          <Ticket size={17} aria-hidden="true" />
                          예매하기
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </section>
  );
}
