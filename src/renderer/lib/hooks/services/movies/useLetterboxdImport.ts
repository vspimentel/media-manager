import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useLetterboxdImport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const imported = await window.electron.importRatingsFromLetterboxd();
            return imported;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["movies"] });
        }
    })
}