import { useQuery } from "@tanstack/react-query";

/**
 * Fetches movie images for a given TMDB ID using React Query.
 * @param {number} tmbdId - The TMDB ID of the movie for which to fetch images. 
 * @param {string} type - The type of images to fetch ("poster" or "backdrop").
 */
export function useGetMovieImages(tmbdId: number, type: string) {
  return useQuery({
    queryKey: ["images", tmbdId, type],
    queryFn: () => window.electron.getMovieImages(tmbdId, type),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: tmbdId != null && tmbdId !== undefined,
  });
}