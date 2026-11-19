import type { ResultResponse } from "./main/types/common";
import type { LetterboxdReview } from "./main/types/letterboxd";
import type { MovieImage } from "./main/types/movies";
import type { OpenSubtitlesSearchResult } from "./main/types/open-subtitles";
import type { TMBDResult } from "./main/types/tmdb";
import type { AppConfig } from "./renderer/types/common";
import type { Movie } from "./renderer/types/movies";

declare module "*.css";

export { };

declare global {
  type UnsubscribeFunction = () => void;

  type EventRequestMapping = {
    // Window controls
    windowMinimize: void;
    windowToggleMaximize: void;
    windowClose: void;
    windowIsMaximized: void;

    // General services
    getConfig: void;

    // Movie services
    getMovies: { update: boolean, sortBy: string, sortDirection: string };
    getMovie: { id: number };
    searchMovies: { title: string };
    getMovieImages: { tmbdId: number; type: string };

    // Options services
    isLoggedInToLetterboxd: void;
    loginToLetterboxd: void;
    logoutFromLetterboxd: void;
    importRatingsFromLetterboxd: void;
    makeReviewOnLetterboxd: { movieId: number };
    letterboxdReviewSubmitted: void;

    // Movie item actions  
    openMovieFolder: { folder: string };
    playMovie: { movieId: number; subtitleLanguage: string, audioLanguage: string };
    changeMovie: { movieId: number; tmbdId: number };
    changeMovieImage: { movieId: number; imagePath: string; type: string };

    // Movie details actions
    updateMovieFiles: { movieId: number; folder: string };
    openLocalFile: { folder: string; file: string };
    addSubtitleFile: { movieId: number; folder: string; sourcePath: string };
    addTorrentFile: { movieId: number; folder: string; sourcePath: string };
    calculateMovieHash: { movieId: number };
    searchSubtitles: { movieId: number; language: string };

    // Subtitles actions
    testSubtitle: { movieId: number; subtitleFileId: number };
    saveSubtitleFile: { movieId: number; subtitleFileId: number; subtitleFileName: string };
  };

  type EventPayloadMapping = {
    // Window controls
    windowMinimize: boolean;
    windowToggleMaximize: boolean;
    windowClose: boolean;
    windowIsMaximized: boolean;

    // General services
    getConfig: AppConfig;

    // Movie services
    getMovies: Movie[];
    getMovie: Movie | undefined;
    searchMovies: TMBDResult[];
    getMovieImages: MovieImage[];

    // Options services
    isLoggedInToLetterboxd: string | null;
    loginToLetterboxd: string | null;
    logoutFromLetterboxd: void;
    importRatingsFromLetterboxd: number | null;
    makeReviewOnLetterboxd: ResultResponse;
    letterboxdReviewSubmitted: LetterboxdReview;

    // Movie item actions
    openMovieFolder: ResultResponse;
    playMovie: ResultResponse;
    changeMovie: ResultResponse;
    changeMovieImage: ResultResponse;

    // Movie details actions
    updateMovieFiles: ResultResponse;
    openLocalFile: ResultResponse;
    addSubtitleFile: ResultResponse;
    addTorrentFile: ResultResponse;
    calculateMovieHash: ResultResponse;
    searchSubtitles: OpenSubtitlesSearchResult;

    // Subtitles actions
    testSubtitle: ResultResponse;
    saveSubtitleFile: ResultResponse;
  };

  interface Window {
    electron: {
      // Window controls
      windowMinimize: () => Promise<boolean>;
      windowToggleMaximize: () => Promise<boolean>;
      windowClose: () => Promise<boolean>;
      windowIsMaximized: () => Promise<boolean>;

      // General services
      getConfig: () => Promise<AppConfig>;

      // Movie services
      getMovies: (update: boolean, sortBy: string, sortDirection: string) => Promise<Movie[]>;
      getMovie: (id: number) => Promise<Movie | undefined>;
      searchMovies: (title: string) => Promise<TMBDResult[]>;
      getMovieImages: (tmbdId: number, type: string) => Promise<MovieImage[]>;

      // Options services
      isLoggedInToLetterboxd: () => Promise<string | null>;
      loginToLetterboxd: () => Promise<string | null>;
      logoutFromLetterboxd: () => Promise<void>;
      importRatingsFromLetterboxd: () => Promise<number | null>;
      makeReviewOnLetterboxd: (movieId: number) => Promise<ResultResponse>;

      // Movie item actions
      openMovieFolder: (folder: string) => Promise<ResultResponse>;
      playMovie: (movieId: number, subtitleLanguage: string, audioLanguage: string) => Promise<ResultResponse>;
      changeMovie: (movieId: number, tmbdId: number) => Promise<ResultResponse>;
      changeMovieImage: (movieId: number, imagePath: string, type: string) => Promise<ResultResponse>;

      // Movie details actions
      updateMovieFiles: (movieId: number, folder: string) => Promise<ResultResponse>;
      openLocalFile: (folder: string, file: string) => Promise<ResultResponse>;
      addSubtitleFile: (movieId: number, folder: string, file: File) => Promise<ResultResponse>;
      addTorrentFile: (movieId: number, folder: string, file: File) => Promise<ResultResponse>;
      calculateMovieHash: (movieId: number) => Promise<ResultResponse>;
      searchSubtitles: (movieId: number, language: string) => Promise<OpenSubtitlesSearchResult>;

      // Subtitles actions
      testSubtitle: (movieId: number, subtitleFileId: number) => Promise<ResultResponse>;
      saveSubtitleFile: (movieId: number, subtitleFileId: number, subtitleFileName: string) => Promise<ResultResponse>;
    };
  }
}
