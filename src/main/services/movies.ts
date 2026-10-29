import path from "node:path";
import fs from "fs";
import { MovieFolder, TMBDDetails, TMBDResult, TMBDSearch } from "../types/movies";
import { Movie } from "../../renderer/types/movies";
import pLimit from "p-limit";
import { getCachedImage, readJsonCache, writeImageCache, writeJsonCache } from "./cache";
import { loadConfig } from "./config";
import { pathToCacheURL } from "../utils/common";
import console from "node:console";

const config = loadConfig();

const MOVIES_DIR = config.moviesDir;
const TMDB_API_KEY = config.tmdbApiKey;

/**
 * Retrieves all movie folders, formats them, and fetches their data if the data is not already in the cache.
 * Saves the data in cache if necessary. Returns an array of movie data objects.
 * @async
 * @returns {Promise<Movie[]>} An array of movie data objects.
 */
export async function getMovies(): Promise<Movie[]> {
  const movieFolders = await getMovieFolders();
  const formattedMovieFolders = formatMovieFolders(movieFolders);
  const limit = pLimit(5);
  const movies = await Promise.all(
    formattedMovieFolders.map((folder) =>
      limit(async () => {
        const movieData = await getMovieData(folder.name,);
        return movieData;
      }),
    ),
  );
  return movies;
}

/**
 * Retrieves all movie folders from the specified movies directory.
 * @async
 * @returns {Promise<string[]>} An array of movie folder names. 
 */
async function getMovieFolders(): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(MOVIES_DIR, { withFileTypes: true });
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    return folders;
  } catch (error) {
    console.error("Error reading movie folders:", error);
    return [];
  }
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
 * Searches for movies on TMDB by title and returns an array of TMBDResult objects.
 * @async
 * @param title - The title of the movie to search for. 
 * @returns {Promise<TMBDResult[]>} An array of TMBDResult objects containing the search results.
 */
export async function searchMovies(title: string): Promise<TMBDResult[]> {
    try {
      const url = new URL("https://api.themoviedb.org/3/search/movie");
      url.searchParams.append("query", title);
      url.searchParams.append("language", "en-US");
      url.searchParams.append("include_adult", "false");
      url.searchParams.append("page", "1");

      console.log(url.toString());

      const response = await fetch(url,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        },
      );

      if (!response.ok) throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);

      const results: TMBDSearch = await response.json();
      return results.results;
    } catch (error) {
      console.error(`"${title}" was not found on TMBD:`, error);
      return [];
    }
}

/**
 * Fetches detailed movie information from TMDB for a given movie ID and caches it. If the data is already cached, it retrieves it from the cache.
 * @param movieId - The TMDB ID of the movie to fetch information for.
 * @param title - The title of the movie, used for caching purposes.
 * @returns {Promise<TMBDDetails | undefined>} A promise that resolves to the detailed movie information or undefined if an error occurs.
 */
async function getMovieInfo(movieId: number, title: string): Promise<TMBDDetails | undefined> {
  const cacheKey = title.trim().toLowerCase();

  try {
      const url = "https://api.themoviedb.org/3/movie/";

      const response = await fetch(`${url}/${movieId.toString()}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        },
      );

      if (!response.ok) throw new Error(`TMDB request failed ${response.status} ${response.statusText}`);

      const info: TMBDDetails = await response.json();

      await writeJsonCache<TMBDDetails>("movies", cacheKey, info);

      return info;
    } catch (error) {
      console.error(`"Error retrieving movie info for ID ${movieId}":`, error);
      return undefined;
    }
}

/**
 * Fetches the movie poster from TMDB for a given poster path and caches it. If the poster is already cached, it retrieves it from the cache.
 * @async
 * @param posterPath - The path of the poster image on TMDB.
 * @returns {Promise<string>} A promise that resolves to the URL of the cached poster image or an empty string if an error occurs. 
 */
async function getPoster(posterPath: string): Promise<string> {
    const posterUrl = `https://image.tmdb.org/t/p/original${posterPath}`;

    let poster = await getCachedImage("movies", posterUrl);

    if (!poster) {
      try {
        const response = await fetch(posterUrl);

        if (!response.ok) throw new Error(`Poster request failed: ${response.status} ${response.statusText}`);

        poster = await writeImageCache(
          "movies",
          posterUrl,
          await response.arrayBuffer(),
        );
      } catch (error) {
        poster = "";
        console.error(`Error fetching poster:`, error);
      }
    }
    if (poster) return pathToCacheURL(poster);
    else return "";
}

/**
 * Reads the movie duration, fetches movie data from TMDB and caches it. If the data is already cached, it retrieves it from the cache.
 * Also fetches the movie poster and caches it. If the poster is already cached, it retrieves it from the cache.
 * @async
 * @param title The title of the movie to fetch data for.
 * @returns {Promise<Movie>} The movie data object.
 */
async function getMovieData(title: string): Promise<Movie> {

  const cacheKey = title.trim().toLowerCase();

  let movieInfo: TMBDDetails | undefined = await readJsonCache<TMBDDetails>("movies", cacheKey);

  if (!movieInfo) {
    const results = await searchMovies(title);
    const movieId = results.length > 0 ? results[0].id : undefined;
    if (movieId) movieInfo = await getMovieInfo(movieId, title);
  }
  let duration = "00h 00m";

  if (!movieInfo) {
    return {
      title,
      duration,
      poster: "",
      folder: title,
    };
  }

  let poster = "";

  if (movieInfo.poster_path) poster = await getPoster(movieInfo.poster_path);

  if (movieInfo.runtime) {
    const hours = Math.floor(movieInfo.runtime / 60);
    const minutes = movieInfo.runtime % 60;
    duration = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  } 

  return {
    title: movieInfo.title,
    duration,
    poster,
    folder: title
  };
}

