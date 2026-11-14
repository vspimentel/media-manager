import { TMBDResult } from "./main/types/movies";
import { ResultResponse } from "./main/types/common";

declare module "*.css";

export { };

declare global {
  type UnsubscribeFunction = () => void;

  type EventRequestMapping = {
    // Movie services
    getMovies: { update: boolean, sortBy: string, sortDirection: string };
    getMovie: { id: number };
    searchMovies: { title: string };
    getMovieImages: { tmbdId: number; type: string };

    // Movie item actions  
    openMovieFolder: { folder: string };
    openSubtitlesFile: { folder: string; subtitlesFile: string };
    playMovie: { folder: string; videoFile: string, subtitleLanguage: string, audioLanguage: string };
    changeMovie: { movieId: number; tmbdId: number };
    changeMovieImage: { movieId: number; imagePath: string; type: string };

    // Movie details actions
    updateMovieFiles: { movieId: number; folder: string };
    addSubtitleFile: { movieId: number; folder: string; sourcePath: string };
  };

  type EventPayloadMapping = {
    // Movie services
    getMovies: Movie[];
    getMovie: Movie | undefined;
    searchMovies: TMBDResult[];
    getMovieImages: MovieImage[];

    // Movie item actions
    openMovieFolder: ResultResponse;
    openSubtitlesFile: ResultResponse;
    playMovie: ResultResponse;
    changeMovie: ResultResponse;
    changeMovieImage: ResultResponse;

    // Movie details actions
    updateMovieFiles: ResultResponse;
    addSubtitleFile: ResultResponse;
  };

  interface Window {
    electron: {
      // Movie services
      getMovies: (update: boolean, sortBy: string, sortDirection: string) => Promise<Movie[]>;
      getMovie: (id: number) => Promise<Movie | undefined>;
      searchMovies: (title: string) => Promise<TMBDResult[]>;
      getMovieImages: (tmbdId: number, type: string) => Promise<MovieImage[]>;

      // Movie item actions
      openMovieFolder: (folder: string) => Promise<ResultResponse>;
      openSubtitlesFile: (folder: string, subtitlesFile: string) => Promise<ResultResponse>;
      playMovie: (folder: string, videoFile: string, subtitleLanguage: string, audioLanguage: string) => Promise<ResultResponse>;
      changeMovie: (movieId: number, tmbdId: number) => Promise<ResultResponse>;
      changeMovieImage: (movieId: number, imagePath: string, type: string) => Promise<ResultResponse>;

      // Movie details actions
      updateMovieFiles: (movieId: number, folder: string) => Promise<ResultResponse>;
      addSubtitleFile: (movieId: number, folder: string, file: File) => Promise<ResultResponse>;
    };
  }
}
