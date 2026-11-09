import { useQuery } from "@tanstack/react-query";

/**
 * Fetches movie posters for a given TMDB ID using React Query.
 * @param {number} tmbdId - The TMDB ID of the movie for which to fetch posters. 
 */
export function useGetMoviePosters(tmbdId: number) {
  return useQuery({
    queryKey: ["posters", tmbdId],
    queryFn: () => window.electron.getMovieImages(tmbdId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: tmbdId != null && tmbdId !== undefined,
  });
}