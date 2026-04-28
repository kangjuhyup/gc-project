import { Search, Ticket, UserRound } from 'lucide-react';
import { useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMovies } from './movieHooks';
import {
  demoMovies,
  filterMoviesForKeyword,
  formatScreeningTime,
  groupMoviesByTimeline,
} from './movieTimeline';

export function MoviesPage() {
  const [keyword, setKeyword] = useState('');
  const { member } = useAuth();
  const moviesQuery = useMovies(keyword);
  const movies = moviesQuery.data?.items.length ? moviesQuery.data.items : demoMovies;
  const filteredMovies = useMemo(() => filterMoviesForKeyword(movies, keyword), [keyword, movies]);
  const timelineGroups = useMemo(() => groupMoviesByTimeline(filteredMovies), [filteredMovies]);

  const handleKeywordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  return (
    <section className="movie-page" aria-labelledby="movie-page-title">
      <header className="movie-page-header">
        <div>
          <p className="eyebrow">Now Showing</p>
          <h2 id="movie-page-title">영화 타임라인</h2>
        </div>
        <div className="member-chip" aria-label="로그인 회원">
          <UserRound size={18} aria-hidden="true" />
          <span>{member?.nickname || member?.name || '회원'}</span>
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
