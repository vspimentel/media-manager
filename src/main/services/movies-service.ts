import path from "node:path";
import fs from "fs";
import { MovieFolder, MovieImage, TMBDDetails, TMBDImage, TMBDMovieImages, TMBDResult, TMBDSearch } from "../types/movies";
import pLimit from "p-limit";
import { getCachedImage, readJsonCache, writeImageCache, writeJsonCache } from "./cache-service";
import { loadConfig } from "./config-service";
import { pathToCacheURL } from "../utils/common";
import console from "node:console";
import { Movie } from "../database/schema/movie";
import { deleteMovie, getAllMovies, getMovieByFolder, saveMovie } from "../database/services/movie-db-service";

const config = loadConfig();

const MOVIES_DIR = config.moviesDir;
const TMDB_API_KEY = config.tmdbApiKey;

/**
 * Retrieves all movie data from the cache or fetches it from the movie folders if not already cached.
 * If the cache is empty or the update parameter is true, it fetches the data from the movie folders and updates the cache.
 * Otherwise, it retrieves the data from the cache.
 * @async
 * @param update - A boolean indicating whether to update the movie data.
 * @returns {Promise<Movie[]>} An array of movie data objects.
 */
export async function getMovies(update: boolean): Promise<Movie[]> {
  const movies = getAllMovies();
  if (movies.length == 0 || update) return getMoviesFromFolder();
  else return movies;
}

/**
 * Retrieves all movie data from the movie folders and caches it. 
 * If the data is already cached, it retrieves it from the cache.
 * @async
 * @returns {Promise<Movie[]>} An array of movie data objects.
 */
async function getMoviesFromFolder(): Promise<Movie[]> {
  const movieFolders = await getMovieFolders();
  const formattedMovieFolders = formatMovieFolders(movieFolders);
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
  const entries = await fs.promises.readdir(MOVIES_DIR, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Formats an array of movie folder names into an array of MovieFolder objects.
 * @param {string[]} folders - An array of movie folder names.
 * @returns {MovieFolder[]} An array of MovieFolder objects containing the folder path, name, video file, and optional subtitle file.
 */
function formatMovieFolders(folders: string[]): MovieFolder[] {
  const movieFolders = folders.map((folder) => {
    const folderName = folder;
    const folderPath = path.join(MOVIES_DIR, folder);
    const videoFile = fs.readdirSync(folderPath).find((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".mp4" || ext === ".mkv";
    });
    if (!videoFile) return null;
    const subtitleFile = fs.readdirSync(folderPath).find((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".srt" || ext === ".ass";
    });
    return {
      path: folderPath,
      name: folderName,
      videoFile: videoFile,
      subtitleFile: subtitleFile || undefined,
    } as MovieFolder;
  });
  return movieFolders.filter(
    (folder): folder is MovieFolder => folder !== null,
  );
}

/**
 * Searches for movies on TMDB based on the provided query and returns an array of search results. 
 * If an error occurs during the search, it logs the error and returns an empty array.
 * @async
 * @param {string} query - The search query for the movie title.
 * @returns {Promise<TMBDResult[]>} An array of TMBDResult objects containing the search results.
 * @throws {Error} Throws an error if the TMDB request fails.
 */
export async function searchMovies(query: string): Promise<TMBDResult[]> {
  const url = new URL("https://api.themoviedb.org/3/search/movie");

  url.searchParams.append("query", query);
  url.searchParams.append("language", "en-US");
  url.searchParams.append("include_adult", "false");
  url.searchParams.append("page", "1");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status} ${response.statusText})`);
  }

  const results: TMBDSearch = await response.json();

  return results.results;
}

/**
 * Fetches movie posters from TMDB for a given movie ID and returns an array of MovieImage objects.
 * If an error occurs during the fetch, it logs the error and returns an empty array.
 * @async
 * @param {number} tmdbId - The TMDB ID of the movie for which to fetch posters.
 * @returns {Promise<MovieImage[]>} A promise that resolves to an array of MovieImage objects.
 */
export async function getMovieImages(tmdbId: number): Promise<MovieImage[]> {

  let images = await readJsonCache<TMBDMovieImages>("movies-images", tmdbId.toString());

  if (!images) {
    const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}/images`);

    const response = await fetch(url,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`TMDB request failed (${response.status} ${response.statusText})`);
    }

    images = await response.json() as TMBDMovieImages;

    try {
      await writeJsonCache<TMBDMovieImages>("movies-images", tmdbId.toString(), images);
    } catch (error) {
      console.warn(`Failed to cache movie images for ${tmdbId}:`, error);
    }
  }

  const posters: MovieImage[] = images.posters.map((poster: TMBDImage) => ({
    file: poster.file_path,
    language: poster.iso_639_1,
    width: poster.width,
    height: poster.height,
    type: "poster",
  }));

  return posters;

}

/**
 * Fetches detailed movie information from TMDB for a given movie ID and caches it. If the data is already cached, it retrieves it from the cache.
 * @async
 * @param {number} tmdbId - The TMDB ID of the movie to fetch information for.
 * @param {string} cacheKey - The cache key to use for storing the movie information.
 * @returns {Promise<TMBDDetails>} A promise that resolves to the detailed movie information or undefined if an error occurs.
 * @throws {Error} Throws an error if the TMDB request fails.
 */
export async function getMovieInfo(tmdbId: number, cacheKey: string): Promise<TMBDDetails> {

  const url = `https://api.themoviedb.org/3/movie/${tmdbId}`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `TMDB request failed (${response.status} ${response.statusText})`
    );
  }

  const info = await response.json() as TMBDDetails;

  try {
    await writeJsonCache<TMBDDetails>("movies", cacheKey, info);
  } catch (error) {
    console.warn(`Failed to cache movie ${tmdbId}:`, error);
  }

  return info;
}

/**
 * Fetches the movie poster from TMDB for a given poster path and caches it. 
 * If the poster is already cached, it retrieves it from the cache.
 * @async
 * @param {string} posterPath - The path of the poster image on TMDB.
 * @returns {Promise<string>} A promise that resolves to the URL of the cached poster image or an empty string if an error occurs.
 * @throws {Error} Throws an error if the poster request fails.
 */
export async function getPoster(posterPath: string): Promise<string> {
  const posterUrl = `https://image.tmdb.org/t/p/original${posterPath}`;

  let posterImage = await getCachedImage("movies", posterUrl);

  if (!posterImage) {
    const response = await fetch(posterUrl);

    if (!response.ok) {
      throw new Error(`Poster request failed (${response.status} ${response.statusText})`);
    }

    const imageData = await response.arrayBuffer();

    try {
      posterImage = await writeImageCache("movies", posterUrl, imageData);
    } catch (error) {
      console.warn(`Failed to cache poster ${posterUrl}:`, error);
    }
  }

  return posterImage ? pathToCacheURL(posterImage) : posterUrl;
}

/**
 * Fetches the movie data for a given movie folder.
 * @async
 * @param {MovieFolder} folder - The movie folder for which to fetch data.
 * @returns {Promise<Movie>} The movie data object.
 */
async function getMovieData(folder: MovieFolder): Promise<Movie> {

  const movie = getMovieByFolder(folder.name);

  if (movie) return movie;

  const cacheKey = folder.name.trim().toLowerCase();

  let movieInfo = await readJsonCache<TMBDDetails>("movies", cacheKey);

  if (!movieInfo) {
    const results = await searchMovies(folder.name);
    if (results.length > 0) movieInfo = await getMovieInfo(results[0].id, cacheKey);
  }

  let duration = "00h 00m";
  let poster = "";

  if (!movieInfo) {
    return saveMovie({
      title: folder.name,
      videoFile: folder.videoFile,
      duration,
      folder: folder.name,
    })
  }

  if (movieInfo.poster_path) {
    try {
      poster = await getPoster(movieInfo.poster_path);
    } catch (error) {
      console.warn(`Failed to fetch poster for movie "${folder.name}":`, error);
    }
  }

  if (movieInfo.runtime) {
    const hours = Math.floor(movieInfo.runtime / 60);
    const minutes = movieInfo.runtime % 60;
    duration = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  }

  return saveMovie({
    title: movieInfo.title,
    duration,
    folder: folder.name,
    videoFile: folder.videoFile,
    subtitleFile: folder.subtitleFile,
    poster,
    tmbdId: movieInfo.id,
    cacheKey: cacheKey,
  });
}

