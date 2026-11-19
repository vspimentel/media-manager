import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Changes a movie image through Electron.
 *
 * @param variables - The movie image data.
 * @param variables.movieId - The identifier of the movie.
 * @param variables.imagePath - The path of the new image.
 * @param variables.type - The type of image being changed, such as `poster`.
 * @throws Rejects with an error when the image cannot be changed.
 */
export function useChangeImage() {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, imagePath, type }: { movieId: number; imagePath: string, type: string }) => {
            const result = await window.electron.changeMovieImage(movieId, imagePath, type);

            if (!result.success) throw new Error(result.message || "Failed to change movie poster");

            return result;
        },
        onSuccess: (_result, { movieId }) => {
            client.invalidateQueries({ queryKey: ["movies"] })
            client.invalidateQueries({ queryKey: ["movie", movieId] })
        }
    });
}