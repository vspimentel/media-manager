import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAddSubtitleFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, folder, subtitleFile }: { movieId: number; folder: string; subtitleFile: File }) => {
            const result = await window.electron.addSubtitleFile(movieId, folder, subtitleFile);

            if (!result.success) throw new Error(result.message || "Failed to add subtitle file");

            return result;
        },
        onSuccess: async (_result, { movieId }) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["movies"] }),
                queryClient.invalidateQueries({ queryKey: ["movie", movieId] }),
            ]);
        }
    });
}