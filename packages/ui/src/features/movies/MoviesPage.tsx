import { CalendarDays, Search, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/features/payment/paymentSummary';
import type { MovieScheduleResult, MovieSummary, ScheduleScreening } from './movieApi';
import { formatScreeningTime } from './movieTimeline';
import type { TheaterScheduleResult } from './theaterApi';
import { useMoviesPage } from './useMoviesPage';

export function MoviesPage() {
  const {
    allTheatersValue,
    filteredMovies,
    handleFetchNextPage,
    handleKeywordChange,
    handleScheduleDateChange,
    handleSelectMovie,
    handleTheaterChange,
    keyword,
    movieSchedule,
    movieScheduleQuery,
    moviesQuery,
    scheduleDate,
    selectedTheaterId,
    selectedMovieId,
    theaterSchedule,
    theaterScheduleQuery,
    theaters,
    theatersQuery,
  } = useMoviesPage();

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
        <label className="movie-theater-select" htmlFor="movie-theater">
          <span>영화관</span>
          <select
            disabled={theatersQuery.isLoading || theatersQuery.isError}
            id="movie-theater"
            onChange={handleTheaterChange}
            value={selectedTheaterId}
          >
            <option value={allTheatersValue}>전체 영화관</option>
            {theaters.map((theater) => (
              <option key={theater.id} value={String(theater.id)}>
                {theater.name}
              </option>
            ))}
          </select>
        </label>
        <label className="movie-date-select" htmlFor="movie-schedule-date">
          <span>날짜</span>
          <input
            id="movie-schedule-date"
            onChange={handleScheduleDateChange}
            type="date"
            value={scheduleDate}
          />
        </label>
        <span className="movie-count">{filteredMovies.length}편</span>
      </div>

      {moviesQuery.isError ? (
        <p className="status-message" data-state="idle" role="status">
          영화 API 응답을 받지 못해 샘플 영화 목록을 표시합니다.
        </p>
      ) : null}

      {filteredMovies.length ? (
        <div className="movie-card-grid">
          {filteredMovies.map((movie) => (
            <MovieCard
              isSelected={selectedMovieId === movie.id}
              key={movie.id}
              movie={movie}
              onSelect={handleSelectMovie}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}

      {!moviesQuery.isLoading && !moviesQuery.isError && moviesQuery.hasNextPage ? (
        <div className="reservation-actions reservation-actions-centered">
          <Button
            disabled={moviesQuery.isFetchingNextPage}
            onClick={handleFetchNextPage}
            type="button"
            variant="secondary"
          >
            {moviesQuery.isFetchingNextPage ? '불러오는 중' : '더 보기'}
          </Button>
        </div>
      ) : null}

      <MovieSchedulePanel
        isLoading={movieScheduleQuery.isFetching}
        movieId={selectedMovieId}
        schedule={movieSchedule}
      />

      {selectedTheaterId !== allTheatersValue ? (
        <TheaterSchedulePanel
          isLoading={theaterScheduleQuery.isFetching}
          schedule={theaterSchedule}
        />
      ) : null}
    </section>
  );
}

function MovieCard({
  isSelected,
  movie,
  onSelect,
}: {
  isSelected: boolean;
  movie: MovieSummary;
  onSelect: (movieId: number) => void;
}) {
  return (
    <article className="movie-card" data-selected={isSelected}>
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
            <dt>개봉일</dt>
            <dd>{movie.releaseDate}</dd>
          </div>
        </dl>
        <Button onClick={() => onSelect(movie.id)} type="button" variant="secondary">
          <CalendarDays size={17} aria-hidden="true" />
          시간표 보기
        </Button>
      </div>
    </article>
  );
}

function MovieSchedulePanel({
  isLoading,
  movieId,
  schedule,
}: {
  isLoading: boolean;
  movieId?: number;
  schedule?: MovieScheduleResult;
}) {
  if (movieId === undefined) {
    return (
      <section className="schedule-panel" aria-labelledby="movie-schedule-title">
        <h3 id="movie-schedule-title">영화별 상영시간표</h3>
        <p className="schedule-empty">영화를 선택하면 날짜별 상영시간표를 확인할 수 있습니다.</p>
      </section>
    );
  }

  return (
    <section className="schedule-panel" aria-labelledby="movie-schedule-title">
      <h3 id="movie-schedule-title">영화별 상영시간표</h3>
      {isLoading ? <p className="schedule-empty">상영시간표를 불러오고 있습니다.</p> : null}
      {!isLoading && schedule?.theaters.length === 0 ? (
        <p className="schedule-empty">선택한 날짜의 상영시간표가 없습니다.</p>
      ) : null}
      {!isLoading && schedule ? (
        <div className="schedule-group-list">
          {schedule.theaters.map((theater) => (
            <section className="schedule-group" key={theater.theater.id}>
              <header>
                <h4>{theater.theater.name}</h4>
                <p>{theater.theater.address}</p>
              </header>
              <ScreeningButtons
                movieId={schedule.movie.id}
                movieTitle={schedule.movie.title}
                screenings={theater.screenings}
              />
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function TheaterSchedulePanel({
  isLoading,
  schedule,
}: {
  isLoading: boolean;
  schedule?: TheaterScheduleResult;
}) {
  return (
    <section className="schedule-panel" aria-labelledby="theater-schedule-title">
      <h3 id="theater-schedule-title">영화관별 상영시간표</h3>
      {isLoading ? <p className="schedule-empty">영화관 시간표를 불러오고 있습니다.</p> : null}
      {!isLoading && schedule?.movies.length === 0 ? (
        <p className="schedule-empty">선택한 날짜의 영화관 상영시간표가 없습니다.</p>
      ) : null}
      {!isLoading && schedule ? (
        <div className="schedule-group-list">
          {schedule.movies.map((movie) => (
            <section className="schedule-group" key={movie.id}>
              <header>
                <h4>{movie.title}</h4>
                <p>
                  {movie.genre} · {movie.rating} · {movie.runningTime}분
                </p>
              </header>
              <ScreeningButtons movieId={movie.id} movieTitle={movie.title} screenings={movie.screenings} />
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ScreeningButtons({
  movieTitle,
  movieId,
  screenings,
}: {
  movieId: number;
  movieTitle: string;
  screenings: ScheduleScreening[];
}) {
  return (
    <div className="screening-button-grid">
      {screenings.map((screening) => (
        <Button asChild key={screening.id} variant="secondary">
          <Link
            state={{
              movieTitle,
              screenName: screening.screenName,
              screeningEndAt: screening.endAt,
              screeningStartAt: screening.startAt,
            }}
            to={`/movies/${movieId}/screenings/${screening.id}/seats`}
            viewTransition
          >
            <Ticket size={15} aria-hidden="true" />
            <span>{formatScreeningTime(screening.startAt)}</span>
            <small>
              {screening.screenName} · {screening.remainingSeats}/{screening.totalSeats}석 ·{' '}
              {formatCurrency(screening.price)}
            </small>
          </Link>
        </Button>
      ))}
    </div>
  );
}
