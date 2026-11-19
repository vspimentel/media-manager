import { useQuery } from "@tanstack/react-query";

/**
 * Fetches subtitles for a specific movie and language using React Query.
 * @param {number} movieId - The ID of the movie to search for subtitles.
 * @param {string} language - The language of the subtitles to search for.
 */
export function useSearchSubtitles(movieId: number, language: string) {
    return useQuery({
        queryKey: ["subtitles", movieId, language],
        queryFn: () => window.electron.searchSubtitles(movieId, language),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
