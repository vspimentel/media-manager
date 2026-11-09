import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Provides a mutation hook to change the TMDB ID of a movie and invalidate the movies query upon success.
 */
export function useChangeMovie() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ movieId, tmdbId }: { movieId: number; tmdbId: number }) => {
      const result = await window.electron.changeMovie(movieId, tmdbId);

      if (!result.success) throw new Error(result.message || "Failed to change movie");

      return result;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["movies"] })
  });
}