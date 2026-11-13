import { shell } from "electron";
import { loadConfig } from "../services/config-service";
import path from "node:path";
import { updateMovie } from "../database/services/movie-db-service";
import { ResultResponse } from "../types/common";
import { spawn } from "node:child_process"
import { getMovieInfo, getTMDBImage } from "../services/tmbd-service";
import langs from "langs";

const config = loadConfig();

const MOVIES_FOLDER = config.moviesFolder;
const VLC_PATH = config.VLCPath;

/**
 * Opens the folder for a specific movie.
 * @async
 * @param folder {string} The name of the movie folder to open.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function openMovieFolder(folder: string): Promise<ResultResponse> {
  const root = path.resolve(MOVIES_FOLDER);
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
 * @param subtitle {string} The language code of the subtitle to use, or the name of the subtitle file.
 * @param audio {string} The language code of the audio track to use.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function playMovie(folder: string, videoFile: string, subtitle: string, audio: string): Promise<ResultResponse> {
  const filePath = path.resolve(MOVIES_FOLDER, folder, videoFile);
  const root = path.resolve(MOVIES_FOLDER);

  if (!filePath.startsWith(root + path.sep)) {
    return { success: false, message: "Invalid file path" };
  }

  const args: string[] = [filePath];

  if (audio !== "und" && audio !== "") {
    const audioCode = langs.where("1", audio)?.["2B"] || audio;
    args.push(`--audio-language=${audioCode}`);
  }

  if (subtitle.includes('.')) {
    const subtitleFilePath = path.resolve(MOVIES_FOLDER, folder, subtitle);
    if (!subtitleFilePath.startsWith(root + path.sep)) {
      return { success: false, message: "Invalid subtitle file path" };
    }
    args.push(`--sub-file=${subtitleFilePath}`);
  } else if (subtitle !== "und" && subtitle !== "none") {
    const subtitlesCode = langs.where("1", subtitle)?.["2B"] || subtitle;
    args.push(`--sub-language=${subtitlesCode}`);
  }

  try {
    const vlc = spawn(VLC_PATH, args, {
      detached: true,
      stdio: "ignore",
    });

    vlc.on("error", (err) => {
      console.error("Failed to start VLC:", err);
    });

    vlc.unref();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: `Failed to play movie: ${(error as Error).message}`,
    };
  }
}

/**
 * Opens a subtitles file for a specific movie.
 * @param {string} folder - The name of the movie folder.
 * @param {string} subtitlesFile - The name of the subtitles file to open.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function openSubtitlesFile(folder: string, subtitlesFile: string): Promise<ResultResponse> {
  const filePath = path.resolve(MOVIES_FOLDER, folder, subtitlesFile);
  const root = path.resolve(MOVIES_FOLDER);

  if (!filePath.startsWith(root + path.sep)) {
    return { success: false, message: "Invalid file path" };
  }

  const error = await shell.openPath(filePath);

  if (error) return { success: false, message: `Failed to open subtitles file: ${error}` };

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

  let duration = "00h 00m";
  let poster = "";
  let backdrop = "";

  if (movieInfo.poster_path) {
    try {
      poster = (await getTMDBImage(movieInfo.poster_path)).path;
    } catch (error) {
      console.warn(`Failed to fetch poster for movie with ID ${tmbdId}:`, error);
    }
  }

  if (movieInfo.backdrop_path) {
    try {
      backdrop = (await getTMDBImage(movieInfo.backdrop_path)).path;
    } catch (error) {
      console.warn(`Failed to fetch backdrop for movie with ID ${tmbdId}:`, error);
    }
  }

  if (movieInfo.runtime) {
    const hours = Math.floor(movieInfo.runtime / 60);
    const minutes = movieInfo.runtime % 60;
    duration = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  }

  updateMovie(movieId, {
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
    genres: JSON.stringify(movieInfo.genres),
    countries: JSON.stringify(movieInfo.origin_country),
    backdrop
  });

  return { success: true, message: "Movie updated successfully" };
}

/**
 * Fetches a new poster for a given movie and updates the movie record in the database.
 * @async
 * @param {number} movieId - The ID of the movie in the database to update.
 * @param {string} imagePath - The path to the new poster image.
 * @param {string} type - The type of the image to change.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function changeMovieImage(movieId: number, imagePath: string, type: string): Promise<ResultResponse> {
  const image = await getTMDBImage(imagePath);

  updateMovie(movieId, { [type]: image.path, [`${type}Filename`]: image.filename });

  return { success: true, message: `Movie ${type} updated successfully` };
}