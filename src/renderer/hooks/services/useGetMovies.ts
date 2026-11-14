import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

/**
 * Fetches a list of movies using React Query.
 */
export function useGetMovies(sortBy: string, sortDirection: string) {
  const updateRef = useRef(false);

  const query = useQuery({
    queryKey: ["movies", sortBy, sortDirection],
    queryFn: () => window.electron.getMovies(updateRef.current, sortBy, sortDirection),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const update = () => {
    updateRef.current = true;
    query.refetch().finally(() => {
      updateRef.current = false;
    });
  }

  return { ...query, update };
}


