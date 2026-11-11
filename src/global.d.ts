import { TMBDResult } from "./main/types/movies";
import { ResultResponse } from "./main/types/common";

declare module "*.css";

export { };

declare global {
  type UnsubscribeFunction = () => void;

  type EventRequestMapping = {
    // Movie services
    getMovies: { update: boolean };
    getMovie: { id: number };
    searchMovies: { title: string };
    getMovieImages: { tmbdId: number };

    // Movie actions  
    openMovieFolder: { folder: string };
    openSubtitlesFile: { folder: string; subtitlesFile: string };
    playMovie: { folder: string; videoFile: string, subtitleLanguage: string, audioLanguage: string };
    changeMovie: { movieId: number; tmbdId: number };
    changeMoviePoster: { movieId: number; posterPath: string };
  };

  type EventPayloadMapping = {
    // Movie services
    getMovies: Movie[];
    getMovie: Movie | undefined;
    searchMovies: TMBDResult[];
    getMovieImages: MovieImage[];

    // Movie actions
    openMovieFolder: ResultResponse;
    openSubtitlesFile: ResultResponse;
    playMovie: ResultResponse;
    changeMovie: ResultResponse;
    changeMoviePoster: ResultResponse;
  };

  interface Window {
    electron: {
      // Movie services
      getMovies: (update: boolean) => Promise<Movie[]>;
      getMovie: (id: number) => Promise<Movie | undefined>;
      searchMovies: (title: string) => Promise<TMBDResult[]>;
      getMovieImages: (tmbdId: number) => Promise<MovieImage[]>;

      // Movie actions
      openMovieFolder: (folder: string) => Promise<ResultResponse>;
      openSubtitlesFile: (folder: string, subtitlesFile: string) => Promise<ResultResponse>;
      playMovie: (folder: string, videoFile: string, subtitleLanguage: string, audioLanguage: string) => Promise<ResultResponse>;
      changeMovie: (movieId: number, tmbdId: number) => Promise<ResultResponse>;
      changeMoviePoster: (movieId: number, posterPath: string) => Promise<ResultResponse>;
    };
  }
}
