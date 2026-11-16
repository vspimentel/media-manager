import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Provides a mutation hook to change the poster of a movie and invalidate the movies query upon success.
 * @param {number} movieId - The ID of the movie for which to change the poster.
 * @param {string} imagePath - The path of the new poster image.
 * @param {string} type - The type of the image to change.
 * @throws {Error} Throws an error if the mutation fails.
 */
export function useChangeImage() {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, imagePath, type }: { movieId: number; imagePath: string, type: string }) => {
            const result = await window.electron.changeMovieImage(movieId, imagePath, type);

            if (!result.success) throw new Error(result.message || "Failed to change movie poster");

            return result;
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["movies"] })
            client.invalidateQueries({ queryKey: ["movie"] })
        }
    });
}