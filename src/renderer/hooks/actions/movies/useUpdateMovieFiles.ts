import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateMovieFiles() {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, folder }: { movieId: number; folder: string }) => {
            const result = await window.electron.updateMovieFiles(movieId, folder);

            if (!result.success) throw new Error(result.message || "Failed to update movie files");

            return result;
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["movies"] })
            client.invalidateQueries({ queryKey: ["movie"] })
        }
    });
}