import { shell } from "electron";
import { loadConfig } from "../services/config";
import path from "node:path";

const config = loadConfig();

const MOVIES_DIR = config.moviesDir;
const TMDB_API_KEY = config.tmdbApiKey;

/**
 * Opens the folder for a specific movie.
 * @param folderName - The name of the movie folder to open.
 */
export async function openMovieFolder(folderName: string): Promise<void> {
  const target = path.resolve(MOVIES_DIR, folderName);
  const root = path.resolve(MOVIES_DIR);

  if (!target.startsWith(root + path.sep)) return;

  const error = await shell.openPath(target);
  if (error) console.error("Failed to open folder:", error);
}

/** Cache the chosen TMDB match under the movie folder title. */
// export async function changeMovie(folder: string, movieId: number): Promise<Movie> {
//   const movieInfo = await getMovieInfo(movieId, folder);
//   if (!movieInfo) throw new Error("Could not load the selected movie from TMDB");
//   const poster = movieInfo.poster_path ? await getPoster(movieInfo.poster_path) : "";
//   const runtime = movieInfo.runtime ?? 0;
//   return {
//     title: movieInfo.title,
//     duration: `${Math.floor(runtime / 60).toString().padStart(2, "0")}h ${(runtime % 60).toString().padStart(2, "0")}m`,
//     poster,
//     folder,
//   };
// }
