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
    openLocalFile: { library: string; folder: string; file: string };
    openExternalLink: { url: string };
    openFolder: { library: string; folder: string };

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

    // Movie actions
    playMovie: { movieId: number; subtitleLanguage: string, audioLanguage: string };
    changeMovie: { movieId: number; tmbdId: number };
    changeMovieImage: { movieId: number; imagePath: string; type: string };
    updateMovieFiles: { movieId: number; folder: string };
    calculateMovieHash: { movieId: number };

    // Subtitles actions
    searchSubtitles: { movieId: number; language: string };
    addSubtitleFile: { movieId: number; folder: string; sourcePath: string };
    testSubtitle: { movieId: number; subtitleFileId: number };
    saveSubtitleFile: { movieId: number; subtitleFileId: number; subtitleFileName: string };

    // Source actions
    addTorrentFile: { movieId: number; folder: string; sourcePath: string };
    addDownloadLink: { movieId: number; link: string };
    deleteSource: { movieId: number; sourceType: string; sourceValue: string };
  };

  type EventPayloadMapping = {
    // Window controls
    windowMinimize: boolean;
    windowToggleMaximize: boolean;
    windowClose: boolean;
    windowIsMaximized: boolean;

    // General services
    getConfig: AppConfig;
    openLocalFile: ResultResponse;
    openExternalLink: ResultResponse;
    openFolder: ResultResponse;

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

    // Movie actions
    playMovie: ResultResponse;
    changeMovie: ResultResponse;
    changeMovieImage: ResultResponse;
    updateMovieFiles: ResultResponse;
    calculateMovieHash: ResultResponse;

    // Subtitles actions
    searchSubtitles: OpenSubtitlesSearchResult;
    addSubtitleFile: ResultResponse;
    testSubtitle: ResultResponse;
    saveSubtitleFile: ResultResponse;

    // Source actions
    addTorrentFile: ResultResponse;
    addDownloadLink: ResultResponse;
    deleteSource: ResultResponse;
  };

  interface ElectronApi {
    // Window controls
    windowMinimize: () => Promise<boolean>;
    windowToggleMaximize: () => Promise<boolean>;
    windowClose: () => Promise<boolean>;
    windowIsMaximized: () => Promise<boolean>;

    // General services
    getConfig: () => Promise<AppConfig>;
    openLocalFile: (library: string, folder: string, file: string) => Promise<ResultResponse>;
    openExternalLink: (url: string) => Promise<ResultResponse>;
    openFolder: (library: string, folder: string) => Promise<ResultResponse>;


    // Movie services
    getMovie: (id: number) => Promise<Movie | undefined>;
    getMovies: (update: boolean, sortBy: string, sortDirection: string) => Promise<Movie[]>;
    getMovieImages: (tmbdId: number, type: string) => Promise<MovieImage[]>;
    searchMovies: (title: string) => Promise<TMBDResult[]>;

    // Options services
    isLoggedInToLetterboxd: () => Promise<string | null>;
    loginToLetterboxd: () => Promise<string | null>;
    logoutFromLetterboxd: () => Promise<void>;
    importRatingsFromLetterboxd: () => Promise<number | null>;
    makeReviewOnLetterboxd: (movieId: number) => Promise<ResultResponse>;

    // Movie actions
    playMovie: (movieId: number, subtitleLanguage: string, audioLanguage: string) => Promise<ResultResponse>;
    changeMovie: (movieId: number, tmbdId: number) => Promise<ResultResponse>;
    changeMovieImage: (movieId: number, imagePath: string, type: string) => Promise<ResultResponse>;
    updateMovieFiles: (movieId: number, folder: string) => Promise<ResultResponse>;
    calculateMovieHash: (movieId: number) => Promise<ResultResponse>;

    // Subtitles actions
    searchSubtitles: (movieId: number, language: string) => Promise<OpenSubtitlesSearchResult>;
    addSubtitleFile: (movieId: number, folder: string, file: File) => Promise<ResultResponse>;
    testSubtitle: (movieId: number, subtitleFileId: number) => Promise<ResultResponse>;
    saveSubtitleFile: (movieId: number, subtitleFileId: number, subtitleFileName: string) => Promise<ResultResponse>;

    // Source actions
    addTorrentFile: (movieId: number, folder: string, file: File) => Promise<ResultResponse>;
    addDownloadLink: (movieId: number, link: string) => Promise<ResultResponse>;
    deleteSource: (movieId: number, sourceType: string, sourceValue: string) => Promise<ResultResponse>;
  }

  interface Window {
    electron: ElectronApi;
  }
}
