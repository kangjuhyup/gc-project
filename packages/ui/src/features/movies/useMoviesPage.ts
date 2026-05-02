import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ChangeEvent } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { fetchMovieSchedules, fetchMovies } from './movieApi';
import { demoMovies, filterMoviesForKeyword } from './movieTimeline';
import { fetchTheaterSchedules, fetchTheaters } from './theaterApi';

const ALL_THEATERS_VALUE = 'all';

export function useMoviesPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedTheaterId, setSelectedTheaterId] = useState<string>(ALL_THEATERS_VALUE);
  const [selectedMovieId, setSelectedMovieId] = useState<number | undefined>();
  const [scheduleDate, setScheduleDate] = useState(() => toDateInputValue(new Date()));
  const moviesQuery = useInfiniteQuery({
    initialPageParam: undefined as string | undefined,
    queryKey: queryKeys.movies.list(keyword),
    queryFn: ({ pageParam }) => fetchMovies({ cursor: pageParam, keyword }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    retry: 1,
  });
  const theatersQuery = useQuery({
    queryKey: queryKeys.theaters.list(),
    queryFn: fetchTheaters,
    retry: 1,
  });
  const movieScheduleQuery = useQuery({
    enabled: selectedMovieId !== undefined,
    queryKey:
      selectedMovieId === undefined
        ? queryKeys.movies.schedules(0, scheduleDate)
        : queryKeys.movies.schedules(selectedMovieId, scheduleDate),
    queryFn: () => fetchMovieSchedules(selectedMovieId ?? 0, scheduleDate),
    retry: 1,
  });
  const selectedTheaterNumber =
    selectedTheaterId === ALL_THEATERS_VALUE ? undefined : Number(selectedTheaterId);
  const theaterScheduleQuery = useQuery({
    enabled: selectedTheaterNumber !== undefined,
    queryKey:
      selectedTheaterNumber === undefined
        ? queryKeys.theaters.schedules(0, scheduleDate)
        : queryKeys.theaters.schedules(selectedTheaterNumber, scheduleDate),
    queryFn: () => fetchTheaterSchedules(selectedTheaterNumber ?? 0, scheduleDate),
    retry: 1,
  });
  const apiMovies = moviesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const movies = apiMovies.length ? apiMovies : demoMovies;
  const filteredMovies = useMemo(() => filterMoviesForKeyword(movies, keyword), [keyword, movies]);

  const handleKeywordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };
  const handleTheaterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheaterId(event.target.value);
  };
  const handleScheduleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setScheduleDate(event.target.value);
  };
  const handleSelectMovie = (movieId: number) => {
    setSelectedMovieId(movieId);
  };
  const handleFetchNextPage = () => {
    void moviesQuery.fetchNextPage();
  };

  return {
    allTheatersValue: ALL_THEATERS_VALUE,
    filteredMovies,
    handleFetchNextPage,
    handleKeywordChange,
    handleScheduleDateChange,
    handleSelectMovie,
    handleTheaterChange,
    keyword,
    movieSchedule: movieScheduleQuery.data,
    movieScheduleQuery,
    moviesQuery,
    scheduleDate,
    selectedTheaterId,
    selectedMovieId,
    theaterSchedule: theaterScheduleQuery.data,
    theaterScheduleQuery,
    theaters: theatersQuery.data?.items ?? [],
    theatersQuery,
  };
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
