import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ movieId, sourceType, sourceValue }: { movieId: number; sourceType: string; sourceValue: string }) => {
            const result = await window.electron.deleteSource(movieId, sourceType, sourceValue);

            if (!result.success) throw new Error(result.message || "Failed to delete source");

            return result;
        },
        onSuccess: async (_result, { movieId }) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["movie", movieId] }),
            ]);
        }
    });
}