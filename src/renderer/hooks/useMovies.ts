import { useQuery } from "@tanstack/react-query";

export function useMovies() {
  return useQuery({
    queryKey: ["movies"],
    queryFn: () => window.electron.getMovies(),
  });
}
