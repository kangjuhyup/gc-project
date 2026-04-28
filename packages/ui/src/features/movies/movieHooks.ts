import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchMovies } from './movieApi';

export function useMovies(keyword: string) {
  return useQuery({
    queryKey: queryKeys.movies.list(keyword),
    queryFn: () => fetchMovies(keyword),
    retry: 1,
  });
}
