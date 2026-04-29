import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ChangeEvent } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { fetchMovies } from './movieApi';
import { demoMovies, filterMoviesForKeyword, groupMoviesByTimeline } from './movieTimeline';

export function useMoviesPage() {
  const [keyword, setKeyword] = useState('');
  const moviesQuery = useQuery({
    queryKey: queryKeys.movies.list(keyword),
    queryFn: () => fetchMovies(keyword),
    retry: 1,
  });
  const movies = moviesQuery.data?.items.length ? moviesQuery.data.items : demoMovies;
  const filteredMovies = useMemo(() => filterMoviesForKeyword(movies, keyword), [keyword, movies]);
  const timelineGroups = useMemo(() => groupMoviesByTimeline(filteredMovies), [filteredMovies]);

  const handleKeywordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  return {
    filteredMovies,
    handleKeywordChange,
    keyword,
    moviesQuery,
    timelineGroups,
  };
}
