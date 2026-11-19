import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCalculateHash() {
    const client = useQueryClient();

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async ({ movieId }: { movieId: number }) => {
            const result = await window.electron.calculateMovieHash(movieId);

            if (!result.success) throw new Error(result.message || "Failed to calculate movie hash");

            return result;
        },
        onSuccess: (_result, { movieId }) => {
            client.invalidateQueries({ queryKey: ["movie", movieId] })
        }
    });

    return { mutateAsync, isPending };
}