import { useQuery } from "@tanstack/react-query";

/**
 * Fetches movie data for a given movie ID using React Query.
 * @param {number} id - The ID of the movie for which to fetch data.
 */
export function useGetMovie(id: number) {
    return useQuery({
        queryKey: ["movie", id],
        queryFn: () => window.electron.getMovie(id),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: id != null && id !== undefined,
    });
}