import { TMBDResult } from "./main/types/movies";

declare module "*.css";

export {};

declare global {
  type UnsubscribeFunction = () => void;

  type EventRequestMapping = {
    getMovies: void;
    openMovieFolder: string;
    searchMovies: string;
  };

  type EventPayloadMapping = {
    getMovies: Movie[];
    openMovieFolder: void;
    searchMovies: TMBDResult[];
  };

  interface Window {
    electron: {
      // Movie services
      getMovies: () => Promise<Movie[]>;
      searchMovies: (title: string) => Promise<TMBDResult[]>;

      // Movie actions
      openMovieFolder: (folderName: string) => Promise<void>;
    };
  }
}
