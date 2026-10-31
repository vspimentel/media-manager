import { TMBDResult } from "./main/types/movies";
import { ResultResponse } from "./main/types/common";

declare module "*.css";

export {};

declare global {
  type UnsubscribeFunction = () => void;

  type EventRequestMapping = {
    // Movie services
    getMovies: void;
    searchMovies: { title: string };
    // Movie actions  
    openMovieFolder: { folderName: string };
    changeMovie: { movieId: number; tmbdId: number };
  };

  type EventPayloadMapping = {
    // Movie services
    getMovies: Movie[];
    searchMovies: TMBDResult[];

    // Movie actions
    openMovieFolder: void;
    changeMovie: ResultResponse;
  };

  interface Window {
    electron: {
      // Movie services
      getMovies: () => Promise<Movie[]>;
      searchMovies: (title: string) => Promise<TMBDResult[]>;

      // Movie actions
      openMovieFolder: (folderName: string) => Promise<void>;
      changeMovie: (movieId: number, tmbdId: number) => Promise<ResultResponse>;
    };
  }
}
