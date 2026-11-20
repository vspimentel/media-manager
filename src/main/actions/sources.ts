import path from "node:path";
import { getMovieByField, updateMovie } from "../database/services/movie-db-service";
import { getConfig } from "../services/config-service";
import { copyFile } from "node:fs/promises";
import { updateMovieFiles } from "./movie";
import { DownloadSource, ResultResponse } from "../types/common";

const config = getConfig();

const MOVIES_FOLDER = config.moviesFolder;

export async function addTorrentFile(movieId: number, folder: string, sourcePath: string): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());
    if (!movie) return { success: false, message: "Movie not found" };

    const movieFolderPath = path.resolve(MOVIES_FOLDER, folder);
    const moviesRoot = path.resolve(MOVIES_FOLDER);

    const sourceFilePath = path.resolve(sourcePath);
    const extension = path.extname(sourceFilePath).toLowerCase();

    if (!movieFolderPath.startsWith(moviesRoot + path.sep)) return { success: false, message: "Invalid movie folder" };

    if (extension !== ".torrent") return { success: false, message: "Not a torrent file" };

    const destinationPath = path.join(movieFolderPath, path.basename(sourceFilePath));

    try {
        await copyFile(sourceFilePath, destinationPath);
    } catch (error) {
        return { success: false, message: `Failed to add torrent file: ${error instanceof Error ? error.message : "Unknown error"}` };
    }

    return await updateMovieFiles(movieId, folder);
}

export async function addDownloadLink(movieId: number, link: string): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());
    if (!movie) return { success: false, message: "Movie not found" };

    const sources = JSON.parse(movie.sources || "[]") as DownloadSource[];

    if (!/^https?:\/\/.+/.test(link)) {
        return { success: false, message: "Invalid link format" };
    }

    if (sources.some(source => source.type === "link" && source.source === link)) {
        return { success: false, message: "Link already exists" };
    }

    sources.push({ type: "link", source: link });

    updateMovie(movieId, { sources: JSON.stringify(sources) });

    return { success: true, message: "Link added successfully" };
}


export async function deleteSource(movieId: number, sourceType: string, sourceValue: string): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());
    if (!movie) return { success: false, message: "Movie not found" };

    const sources = JSON.parse(movie.sources || "[]") as DownloadSource[];

    const updatedSources = sources.filter(source => !(source.type === sourceType && source.source === sourceValue));

    if (updatedSources.length === sources.length) {
        return { success: false, message: "Source not found" };
    }

    updateMovie(movieId, { sources: JSON.stringify(updatedSources) });
    return { success: true, message: "Source deleted successfully" };
}