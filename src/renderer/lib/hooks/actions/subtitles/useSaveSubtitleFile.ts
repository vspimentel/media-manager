import { useMutation, useQueryClient } from "@tanstack/react-query";

export function usSaveSubtitleFile() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async ({ movieId, subtitleFileId, subtitleFileName }: { movieId: number; subtitleFileId: number; subtitleFileName: string }) => {
            const result = await window.electron.saveSubtitleFile(movieId, subtitleFileId, subtitleFileName);

            if (!result.success) throw new Error(result.message || "Failed to save subtitle file");

            return result;
        },
        onSuccess: async (_result, { movieId }) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["movies"] }),
                queryClient.invalidateQueries({ queryKey: ["movie", movieId] }),
            ]);
        }
    });

    return { mutateAsync, isPending };
}