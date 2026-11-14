import path from "node:path";
import fs from "fs";
import { MovieFolder, MovieLocalSubtitle, MovieMetadata } from "../types/movies";
import pLimit from "p-limit";
import { readJsonCache } from "./cache-service";
import { loadConfig } from "./config-service";
import { Movie } from "../database/schema/movie";
import { deleteMovie, getAllMovies, getMovieByField, saveMovie } from "../database/services/movie-db-service";
import { TMBDDetails } from "../types/tmdb";
import { getMovieInfo, getTMDBImage, searchMovies } from "./tmbd-service";
import { getMovieMetadata, getSubtitleLanguage } from "./metadata-service";

const config = loadConfig();

const MOVIES_FOLDER = config.moviesFolder;
const preferredAudioLanguages = config.preferences.audioLanguage || ["eng"];
const preferredSubtitleLanguages = config.preferences.subtitleLanguage || ["eng"];
/**
 * Retrieves all movie data from the cache or fetches it from the movie folders if not already cached.
 * If the cache is empty or the update parameter is true, it fetches the data from the movie folders and updates the cache.
 * Otherwise, it retrieves the data from the cache.
 * @async
 * @param update - A boolean indicating whether to update the movie data.
 * @param sortBy - The field to sort the movies by.
 * @param sortDirection - The direction to sort the movies in.
 * @returns {Promise<Movie[]>} An array of movie data objects.
 */
export async function getMovies(update: boolean, sortBy: string, sortDirection: string): Promise<Movie[]> {
  const movies = getAllMovies(sortBy, sortDirection);
  if (movies.length == 0 || update) return getMoviesFromFolder();
  else return movies;
}

/**
 * Fetches a specific movie from the database based on its ID.
 * @async
 * @param {number} id - The ID of the movie to fetch.
 * @returns {Promise<Movie | undefined>} A promise that resolves to the movie object if found, or undefined if not found.
 */
export async function getMovie(id: number): Promise<Movie | undefined> {
  const movie = getMovieByField("id", id.toString());
  return movie;
}

/**
 * Retrieves all movie data from the movie folders and caches it. 
 * If the data is already cached, it retrieves it from the cache.
 * @async
 * @returns {Promise<Movie[]>} An array of movie data objects.
 */
async function getMoviesFromFolder(): Promise<Movie[]> {
  const movieFolders = await getMovieFolders();
  const formattedMovieFolders = movieFolders.map(formatMovieFolder)
    .filter((folder): folder is MovieFolder => folder !== null);
  cleanUpMovies(formattedMovieFolders);
  const limit = pLimit(5);
  const movies = await Promise.all(
    formattedMovieFolders.map((folder) =>
      limit(async () => {
        const movieData = await getMovieData(folder);
        return movieData;
      }),
    ),
  );
  return movies;
}

/**
 * Cleans up the movie database by removing any movies that no longer exist in the 
 * specified movie folders.
 * @async
 * @param {MovieFolder[]} folders - An array of MovieFolder objects representing the current movie folders.
 * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
 */
async function cleanUpMovies(folders: MovieFolder[]): Promise<void> {
  const movies = getAllMovies();
  movies.map((movie) => {
    const folderExists = folders.some((folder) => folder.name === movie.folder);
    if (!folderExists) deleteMovie(movie.id);
  })
}

/**
 * Retrieves all movie folders from the specified movies directory.
 * @async
 * @returns {Promise<string[]>} An array of movie folder names. 
 */
async function getMovieFolders(): Promise<string[]> {
  const entries = await fs.promises.readdir(MOVIES_FOLDER, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Formats an array of movie folder names into an array of MovieFolder objects.
 * @param {string} folder - The name of the movie folder to format.
 * @returns {MovieFolder | null} A MovieFolder object containing the folder path, name, video file, and optional subtitle file, or null if the folder is invalid.
 */
export function formatMovieFolder(folder: string): MovieFolder | null {
  const folderName = folder;
  const folderPath = path.join(MOVIES_FOLDER, folder);
  const videoFile = fs.readdirSync(folderPath).find((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".mp4" || ext === ".mkv";
  });
  if (!videoFile) return null;
  const subtitlesFiles = fs.readdirSync(folderPath).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".srt", ".vtt", ".ass", ".ssa", ".sub", ".idx", ".txt"].includes(ext);
  });
  return {
    path: folderPath,
    name: folderName,
    videoFile: videoFile,
    subtitlesFiles: subtitlesFiles,
  } as MovieFolder;

}

/**
 * Fetches the movie data for a given movie folder.
 * @async
 * @param {MovieFolder} folder - The movie folder for which to fetch data.
 * @returns {Promise<Movie>} The movie data object.
 */
async function getMovieData(folder: MovieFolder): Promise<Movie> {

  const movie = getMovieByField("folder", folder.name);

  if (movie) return movie;

  let metadata: MovieMetadata | undefined;

  try {
    metadata = await getMovieMetadata(folder.path, folder.videoFile);
  } catch (error) {
    console.error(`Failed to get metadata for movie "${folder.name}":`, error);
  }

  let subtitleFiles: MovieLocalSubtitle[] = [];

  if (folder.subtitlesFiles.length > 0) {
    subtitleFiles = folder.subtitlesFiles.map((subtitleFile, index) => {
      try {
        const language = getSubtitleLanguage(folder.path, subtitleFile);
        return {
          file: subtitleFile,
          language: `${language}-${index + 1}`,
        };
      } catch (error) {
        console.error(`Failed to read subtitle language for movie "${folder.name}" and subtitle file "${subtitleFile}":`, error);
        return {
          file: subtitleFile,
          language: `und-${index + 1}`,
        };
      }
    });
  }

  const cacheKey = folder.name.trim().toLowerCase();

  let movieInfo = await readJsonCache<TMBDDetails>("movies", cacheKey);

  if (!movieInfo) {
    const results = await searchMovies(folder.name);
    if (results.length > 0) movieInfo = await getMovieInfo(results[0].id, cacheKey);
  }

  let poster = "";
  let backdrop = "";
  let duration = "";

  if (!movieInfo) {
    return saveMovie({
      videoFile: folder.videoFile,
      folder: folder.name,
    })
  }

  if (movieInfo.poster_path) {
    try {
      poster = (await getTMDBImage(movieInfo.poster_path)).path;
    } catch (error) {
      console.warn(`Failed to fetch poster for movie "${folder.name}":`, error);
    }
  }

  if (movieInfo.backdrop_path) {
    try {
      backdrop = (await getTMDBImage(movieInfo.backdrop_path)).path;
    } catch (error) {
      console.warn(`Failed to fetch backdrop for movie "${folder.name}":`, error);
    }
  }

  if (movieInfo.runtime) {
    const hours = Math.floor(movieInfo.runtime / 60);
    const minutes = movieInfo.runtime % 60;
    duration = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  }

  const selectPreferredLanguage = (available: string[], preferred: string[]): string => {
    for (let preferredLang of preferred) {
      if (preferredLang === "original") preferredLang = movieInfo?.original_language || "";
      for (const availableLang of available) {
        if (availableLang.split("-")[0] === preferredLang) {
          return availableLang;
        }
      }
    }
    return available[0] || "";
  };

  const availableSubtitleLanguages = [
    ...new Set([
      ...subtitleFiles.map((subtitle) => subtitle.language),
      ...(metadata?.subtitleLanguages || [])
    ])
  ];
  const selectedAudioLanguage = selectPreferredLanguage(metadata?.audioLanguages || [], preferredAudioLanguages);
  const selectedSubtitleLanguage = selectPreferredLanguage(availableSubtitleLanguages || [], preferredSubtitleLanguages);

  return saveMovie({
    folder: folder.name,
    videoFile: folder.videoFile,
    subtitleFiles: JSON.stringify(subtitleFiles),
    resolution: JSON.stringify(metadata?.resolution || { tag: "", width: 0, height: 0 }),
    videoCodec: metadata?.videoCodec || "",
    audioCodecs: JSON.stringify(metadata?.audioCodecs || []),
    audioLanguages: JSON.stringify(metadata?.audioLanguages || []),
    subtitleLanguages: JSON.stringify(metadata?.subtitleLanguages || []),
    filesize: metadata?.filesize || 0,
    selectedAudioLanguage,
    selectedSubtitleLanguage,
    cacheKey,
    tmbdId: movieInfo.id,
    title: movieInfo.title,
    originalTitle: movieInfo.original_title,
    originalLanguage: movieInfo.original_language,
    tagline: movieInfo.tagline,
    overview: movieInfo.overview,
    releaseDate: movieInfo.release_date,
    duration,
    voteAverage: movieInfo.vote_average,
    voteCount: movieInfo.vote_count,
    poster,
    posterFilename: movieInfo.poster_path,
    backdrop,
    backdropFilename: movieInfo.backdrop_path,
    genres: JSON.stringify(movieInfo.genres),
    countries: JSON.stringify(movieInfo.origin_country),
  });
}
