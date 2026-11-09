import { TMBDResult } from "./main/types/movies";
import { ResultResponse } from "./main/types/common";

declare module "*.css";

export { };

declare global {
  type UnsubscribeFunction = () => void;

  type EventRequestMapping = {
    // Movie services
    getMovies: { update: boolean };
    searchMovies: { title: string };
    getMovieImages: { tmbdId: number };

    // Movie actions  
    openMovieFolder: { folderName: string };
    playMovie: { folder: string; videoFile: string };
    changeMovie: { movieId: number; tmbdId: number };
    changeMoviePoster: { movieId: number; posterPath: string };
  };

  type EventPayloadMapping = {
    // Movie services
    getMovies: Movie[];
    searchMovies: TMBDResult[];
    getMovieImages: MovieImage[];

    // Movie actions
    openMovieFolder: ResultResponse;
    playMovie: ResultResponse;
    changeMovie: ResultResponse;
    changeMoviePoster: ResultResponse;
  };

  interface Window {
    electron: {
      // Movie services
      getMovies: (update: boolean) => Promise<Movie[]>;
      searchMovies: (title: string) => Promise<TMBDResult[]>;
      getMovieImages: (tmbdId: number) => Promise<MovieImage[]>;

      // Movie actions
      openMovieFolder: (folderName: string) => Promise<ResultResponse>;
      playMovie: (folder: string, videoFile: string) => Promise<ResultResponse>;
      changeMovie: (movieId: number, tmbdId: number) => Promise<ResultResponse>;
      changeMoviePoster: (movieId: number, posterPath: string) => Promise<ResultResponse>;
    };
  }
}
