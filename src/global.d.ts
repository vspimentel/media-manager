
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

    // Movie services
    getMovies: { update: boolean, sortBy: string, sortDirection: string };
    getMovie: { id: number };
    searchMovies: { title: string };
    getMovieImages: { tmbdId: number; type: string };

    // Movie item actions  
    openMovieFolder: { folder: string };
    playMovie: { folder: string; videoFile: string, subtitleLanguage: string, audioLanguage: string };
    changeMovie: { movieId: number; tmbdId: number };
    changeMovieImage: { movieId: number; imagePath: string; type: string };

    // Movie details actions
    updateMovieFiles: { movieId: number; folder: string };
    openLocalFile: { folder: string; file: string };
    addSubtitleFile: { movieId: number; folder: string; sourcePath: string };
    addTorrentFile: { movieId: number; folder: string; sourcePath: string };

    // Options services
    isLoggedInToLetterboxd: void;
    loginToLetterboxd: void;
    logoutFromLetterboxd: void;
    importRatingsFromLetterboxd: void;
    makeReviewOnLetterboxd: { movieId: number };
    letterboxdReviewSubmitted: void;
  };

  type EventPayloadMapping = {
    // Window controls
    windowMinimize: boolean;
    windowToggleMaximize: boolean;
    windowClose: boolean;
    windowIsMaximized: boolean;

    // Movie services
    getMovies: Movie[];
    getMovie: Movie | undefined;
    searchMovies: TMBDResult[];
    getMovieImages: MovieImage[];

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

    // Options services
    isLoggedInToLetterboxd: string | null;
    loginToLetterboxd: string | null;
    logoutFromLetterboxd: void;
    importRatingsFromLetterboxd: number | null;
    makeReviewOnLetterboxd: ResultResponse;
    letterboxdReviewSubmitted: LetterboxdReview;
  };

  interface Window {
    electron: {
      // Window controls
      windowMinimize: () => Promise<boolean>;
      windowToggleMaximize: () => Promise<boolean>;
      windowClose: () => Promise<boolean>;
      windowIsMaximized: () => Promise<boolean>;

      // Movie services
      getMovies: (update: boolean, sortBy: string, sortDirection: string) => Promise<Movie[]>;
      getMovie: (id: number) => Promise<Movie | undefined>;
      searchMovies: (title: string) => Promise<TMBDResult[]>;
      getMovieImages: (tmbdId: number, type: string) => Promise<MovieImage[]>;

      // Movie item actions
      openMovieFolder: (folder: string) => Promise<ResultResponse>;
      playMovie: (folder: string, videoFile: string, subtitleLanguage: string, audioLanguage: string) => Promise<ResultResponse>;
      changeMovie: (movieId: number, tmbdId: number) => Promise<ResultResponse>;
      changeMovieImage: (movieId: number, imagePath: string, type: string) => Promise<ResultResponse>;

      // Movie details actions
      updateMovieFiles: (movieId: number, folder: string) => Promise<ResultResponse>;
      openLocalFile: (folder: string, file: string) => Promise<ResultResponse>;
      addSubtitleFile: (movieId: number, folder: string, file: File) => Promise<ResultResponse>;
      addTorrentFile: (movieId: number, folder: string, file: File) => Promise<ResultResponse>;

      // Options services
      isLoggedInToLetterboxd: () => Promise<string | null>;
      loginToLetterboxd: () => Promise<string | null>;
      logoutFromLetterboxd: () => Promise<void>;
      importRatingsFromLetterboxd: () => Promise<number | null>;
      makeReviewOnLetterboxd: (movieId: number) => Promise<ResultResponse>;
    };
  }
}
