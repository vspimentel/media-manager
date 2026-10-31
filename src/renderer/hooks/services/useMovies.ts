import { useQuery } from "@tanstack/react-query";

export function useMovies() {
  return useQuery({
    queryKey: ["movies"],
    queryFn: () => window.electron.getMovies(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}


