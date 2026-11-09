import { shell } from "electron";
import { loadConfig } from "../services/config-service";
import path from "node:path";
import { getMovieInfo, getPoster } from "../services/movies-service";
import { updateMovie } from "../database/services/movie-db-service";
import { ResultResponse } from "../types/common";

const config = loadConfig();

const MOVIES_DIR = config.moviesDir;

/**
 * Opens the folder for a specific movie.
 * @async
 * @param folder {string} The name of the movie folder to open.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function openMovieFolder(folder: string): Promise<ResultResponse> {
  const root = path.resolve(MOVIES_DIR);
  const target = path.resolve(root, folder);

  if (!target.startsWith(root + path.sep)) {
    return { success: false, message: "Invalid folder path" };
  }

  const error = await shell.openPath(target);

  if (error) return { success: false, message: `Failed to open folder: ${error}` };

  return { success: true };
}

/**
 * Plays a movie file using the default system player.
 * @async
 * @param folder {string} The name of the movie folder. 
 * @param videoFile {string} The name of the video file to play.
 */
export async function playMovie(folder: string, videoFile: string): Promise<ResultResponse> {
  const filePath = path.resolve(MOVIES_DIR, folder, videoFile);
  const root = path.resolve(MOVIES_DIR);

  if (!filePath.startsWith(root + path.sep)) {
    return { success: false, message: "Invalid file path" };
  }

  const error = await shell.openPath(filePath);

  if (error) return { success: false, message: `Failed to play movie: ${error}` };

  return { success: true };
}

/**
 * Fetches detailed movie information from TMDB for a given movie ID and updates the movie record in the database.
 * @async
 * @param {number} movieId - The ID of the movie in the database to update.
 * @param {number} tmbdId - The TMDB ID of the movie to fetch information for.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function changeMovie(movieId: number, tmbdId: number): Promise<ResultResponse> {
  const movieInfo = await getMovieInfo(tmbdId, movieId.toString());

  if (!movieInfo) return { success: false, message: `Failed to retrieve movie info for ID ${tmbdId}` };

  let poster = "";

  if (movieInfo.poster_path) {
    try {
      poster = await getPoster(movieInfo.poster_path);
    } catch (error) {
      console.warn(`Failed to fetch poster for movie ID ${tmbdId}:`, error);
    }
  }

  let duration = "00h 00m";

  if (movieInfo.runtime) {
    const hours = Math.floor(movieInfo.runtime / 60);
    const minutes = movieInfo.runtime % 60;
    duration = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  }

  updateMovie(movieId, {
    title: movieInfo.title,
    duration,
    tmbdId,
    poster,
  });

  return { success: true, message: "Movie updated successfully" };
}


export async function changeMoviePoster(movieId: number, posterPath: string): Promise<ResultResponse> {
  const poster = await getPoster(posterPath);

  updateMovie(movieId, {
    poster,
  });

  return { success: true, message: "Movie poster updated successfully" };
}