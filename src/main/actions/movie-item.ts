import { shell } from "electron";
import { loadConfig } from "../services/config-service";
import path from "node:path";
import { getMovieInfo, getPoster } from "../services/movies-service";
import { updateMovie } from "../database/services/movie-db-service";
import { ResultResponse } from "../types/common";

const config = loadConfig();

const MOVIES_DIR = config.moviesDir;
const TMDB_API_KEY = config.tmdbApiKey;

/**
 * Opens the folder for a specific movie.
 * @async
 * @param folderName {string} The name of the movie folder to open.
 */
export async function openMovieFolder(folderName: string): Promise<void> {
  const target = path.resolve(MOVIES_DIR, folderName);
  const root = path.resolve(MOVIES_DIR);

  if (!target.startsWith(root + path.sep)) return;

  const error = await shell.openPath(target);
  if (error) console.error("Failed to open folder:", error);
}

/**
 * Fetches detailed movie information from TMDB for a given movie ID and updates the movie record in the database.
 * @async
 * @param movieId {number} The ID of the movie in the database to update.
 * @param tmbdId {number} The TMDB ID of the movie to fetch information for.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function changeMovie(movieId: number, tmbdId: number): Promise<ResultResponse> {
  const movieInfo = await getMovieInfo(tmbdId, movieId.toString());
  if (!movieInfo) {
    console.error(`Failed to retrieve movie info for ID ${tmbdId}`);
    return {success: false, message: `Failed to retrieve movie info for ID ${tmbdId}`};
  }

  let poster = "";
  if (movieInfo.poster_path) poster = await getPoster(movieInfo.poster_path);

  let duration = "00h 00m";
  if (movieInfo.runtime) {
    const hours = Math.floor(movieInfo.runtime / 60);
    const minutes = movieInfo.runtime % 60;
    duration = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  } 
  updateMovie(movieId, {
    title: movieInfo.title,
    duration,
    poster,
  });
  return {success: true, message: "Movie updated successfully"};
  
}
