import { useQuery } from "@tanstack/react-query";

/**
 * Fetches movies based on a search title using React Query.
 * @param {string} title - The title to search for movies.
 */
export function useSearchMovies(title: string) {
  return useQuery({
    queryKey: ["movies", title],
    queryFn: () => window.electron.searchMovies(title),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: title.trim().length > 0,
  });
}