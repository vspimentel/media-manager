import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAddTorrentFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, folder, torrentFile }: { movieId: number; folder: string; torrentFile: File }) => {
            const result = await window.electron.addTorrentFile(movieId, folder, torrentFile);

            if (!result.success) throw new Error(result.message || "Failed to add torrent file");

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