import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useChangeMovie() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({
      movieId,
      tmbdId,
    }: {
      movieId: number;
      tmbdId: number;
    }) => window.electron.changeMovie(movieId, tmbdId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["movies"] });
    }
  });
}