import { MovieFolder } from "./main/types/movies";

declare module "*.css";

export {};

declare global {
  type UnsubscribeFunction = () => void;

  type EventPayloadMapping = {
    getMovies: Movie[];
  };

  interface Window {
    electron: {
      getMovies: () => Promise<Movie[]>;
    };
  }
}
