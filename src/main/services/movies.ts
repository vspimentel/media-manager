import path from "node:path";
import fs from "fs";
import { MovieFolder } from "../types/movies";
import { Movie } from "../../renderer/types/movies";
import pLimit from "p-limit";
import { getVideoDurationInSeconds } from "get-video-duration";

const MOVIES_DIR = path.join("D:", "Movies");
const API_KEY =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjNTI5OTJlYmYwYmQ1YTVlY2Y1OTM4NzJhN2RmNDhhYyIsIm5iZiI6MTc4NzYyMDkxNC45ODIsInN1YiI6IjZhOGNlZTMyNWE4NTJhMTZmMTdmZWIzYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.433KZqFfVF9QTE5aXIzjzITIYGZEym8UMwTEKt8DDrA";

export async function getMovies() {
  const movieFolders = await getMovieFolders();
  const formattedMovieFolders = formatMovieFolders(movieFolders);
  const limit = pLimit(5);
  const movies = await Promise.all(
    formattedMovieFolders.map((folder) =>
      limit(async () => {
        const movieData = await getMovieData(
          folder.name,
          path.join(folder.path, folder.videoFile),
        );
        return movieData;
      }),
    ),
  );
  return movies;
}

async function getMovieFolders(): Promise<string[]> {
  try {
    const entries = await fs.promises.readdir(MOVIES_DIR, {
      withFileTypes: true,
    });
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    return folders;
  } catch (error) {
    console.error("Error reading movie folders:", error);
    return [];
  }
}

function formatMovieFolders(folders: string[]): MovieFolder[] {
  const movieFolders = folders.map((folder) => {
    const folderName = folder;
    const folderPath = path.join(MOVIES_DIR, folder);
    const subtitleFile = fs.readdirSync(folderPath).find((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".srt" || ext === ".ass";
    });
    const videoFile = fs.readdirSync(folderPath).find((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".mp4" || ext === ".mkv";
    });
    if (!videoFile) return null;
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

async function getVideoDuration(filePath: string): Promise<number> {
  try {
    return await getVideoDurationInSeconds(filePath);
  } catch (err) {
    console.warn(`No se pudo leer duración de ${filePath}:`, err);
    return 0;
  }
}

async function getMovieData(title: string, video: string): Promise<Movie> {
  const duration = await getVideoDuration(video);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const formattedDuration = `${hours}h ${minutes}m`;

  const url = "https://api.themoviedb.org/3/search/movie";
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  const response = await fetch(
    `${url}?query=${encodeURIComponent(title)}`,
    options,
  );
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const movie = data.results[0];
    return {
      title: movie.title,
      duration: formattedDuration,
      poster: movie.poster_path
        ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
        : "",
    };
  } else {
    return {
      title: title,
      duration: "Unknown",
      poster: "",
    };
  }
}
