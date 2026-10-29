import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "fs";
import { MovieFolder } from "../types/movies";
import { Movie, TMBDDetails, TMBDResult, TMBDSearch } from "../../renderer/types/movies";
import pLimit from "p-limit";
import { getCachedImage, readJsonCache, writeImageCache, writeJsonCache } from "./cache";
import { loadConfig } from "./config";
import { pathToCacheURL } from "../utils/general";

const config = loadConfig();

const MOVIES_DIR = config.moviesDir;
const TMDB_API_KEY = config.tmdbApiKey;

/**
 * Retrieves all movie folders, formats them, and fetches their data if the data is not already in the cache.
 * Saves the data in cache if necessary. Returns an array of movie data objects.
 * 
 * @async
 * @function getMovies
 * @returns {Promise<Movie[]>}
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
 * @param {string[]} folders 
 * @returns {MovieFolder[]}
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

async function searchMovie(title: string): Promise<number | undefined> {
    try {
      const url = "https://api.themoviedb.org/3/search/movie";

      const response = await fetch(
        `${url}?query=${encodeURIComponent(title)}`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        },
      );

      if (!response.ok) throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);

      const results: TMBDSearch = await response.json();
      const movieId = results.results[0].id;

      return movieId;
    } catch (error) {
      console.error(`"${title}" was not found on TMBD:`, error);
      return undefined;
    }
}

async function getMovieInfo(movieId: number, title: string): Promise<TMBDDetails | undefined> {
  const cacheKey = title.trim().toLowerCase();

  try {
      const url = "https://api.themoviedb.org/3/movie/";

      const response = await fetch(
        `${url}/${movieId.toString()}`,
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
    const movieId = await searchMovie(title);
    if (movieId) movieInfo = await getMovieInfo(movieId, title);
  }

  let duration = "00h 00m";

  if (!movieInfo) {
    return {
      title,
      duration,
      poster: "",
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
  };
}
