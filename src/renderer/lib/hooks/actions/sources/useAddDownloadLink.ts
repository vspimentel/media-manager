import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAddDownloadLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, link }: { movieId: number; link: string }) => {
            const result = await window.electron.addDownloadLink(movieId, link);

            if (!result.success) throw new Error(result.message || "Failed to add download link");

            return result;
        },
        onSuccess: async (_result, { movieId }) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["movie", movieId] }),
            ]);
        }
    });
}