import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Provides a mutation hook to change the poster of a movie and invalidate the movies query upon success.
 */
export function useChangePoster() {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, posterPath }: { movieId: number; posterPath: string }) => {
            const result = await window.electron.changeMoviePoster(movieId, posterPath);

            if (!result.success) throw new Error(result.message || "Failed to change movie poster");

            return result;
        },
        onSuccess: () => client.invalidateQueries({ queryKey: ["movies"] })
    });
}