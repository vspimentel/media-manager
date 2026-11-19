import { useQuery } from "@tanstack/react-query";
/**
 * Fetches the application configuration using React Query.
 */
export function useGetConfig() {
    return useQuery({
        queryKey: ["config"],
        queryFn: () => window.electron.getConfig(),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}