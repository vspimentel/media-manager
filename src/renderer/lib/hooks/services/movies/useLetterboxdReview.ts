import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useLetterboxdReview() {
    const queryClient = useQueryClient();

    const { mutateAsync, isPending } = useMutation({
        mutationFn: async ({ movieId }: { movieId: number }) => {
            const imported = await window.electron.makeReviewOnLetterboxd(movieId);
            return imported;
        },
        onSuccess: (_result, { movieId }) => {
            queryClient.invalidateQueries({ queryKey: ["movies"] });
            queryClient.invalidateQueries({ queryKey: ["movie", movieId] });
        }
    })

    return { mutateAsync, isPending }
}