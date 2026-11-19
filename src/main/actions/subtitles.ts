import path from "node:path";
import { getMovieByField, updateMovie } from "../database/services/movie-db-service";
import { getConfig } from "../services/config-service";
import { getSubtitleFile } from "../services/open-subtitles-service";
import { ResultResponse } from "../types/common";
import { SubtitleDownloadResult } from "../types/open-subtitles";
import { spawn } from "node:child_process";
import { copyFile } from "node:fs/promises";
import { getSubtitleLanguage } from "../services/metadata-service";
import { updateMovieFiles } from "./movie-details";

const config = getConfig();

const MOVIES_FOLDER = config.moviesFolder;
const VLC_PATH = config.VLCPath;

export async function testSubtitle(movieId: number, subtitleFileId: number): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());

    if (!movie) {
        return { success: false, message: "Movie not found." }
    }

    let result: SubtitleDownloadResult;

    try {
        result = await getSubtitleFile(subtitleFileId);
    } catch (error) {
        return { success: false, message: `Failed to obtain the subtitle file: ${error}` };
    }

    if (!result.filename) {
        return { success: false, message: `Limit will reset in ${result.reset}.` };
    }

    const videoFilePath = path.resolve(MOVIES_FOLDER, movie.folder, movie.videoFile);
    const root = path.resolve(MOVIES_FOLDER);

    if (!videoFilePath.startsWith(root + path.sep)) {
        return { success: false, message: "Invalid file path" };
    }

    const args: string[] = [videoFilePath];

    args.push("--no-sub-autodetect-file");
    args.push(`--sub-file=${result.filename}`);

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
        return { success: false, message: `Failed to play movie: ${(error as Error).message}` };
    }
}

export async function saveSubtitleFile(movieId: number, subtitleFileId: number, subtitleFileName: string): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());

    if (!movie) {
        return { success: false, message: "Movie not found." }
    }

    let result: SubtitleDownloadResult;

    try {
        result = await getSubtitleFile(subtitleFileId);
    } catch (error) {
        return { success: false, message: `Failed to obtain the subtitle file: ${error}` };
    }

    if (!result.filename) {
        return { success: false, message: `Limit will reset in ${result.reset}.` };
    }

    const subtitleFilePath = path.resolve(MOVIES_FOLDER, movie.folder, `${subtitleFileName}.srt`);
    const root = path.resolve(MOVIES_FOLDER);

    if (!subtitleFilePath.startsWith(root + path.sep)) {
        return { success: false, message: "Invalid subtitle file path" };
    }

    try {
        await copyFile(result.filename, subtitleFilePath);
    } catch (error) {
        return { success: false, message: `Failed to add subtitle file: ${error instanceof Error ? error.message : "Unknown error"}` };
    }

    return updateMovieFiles(movieId, movie.folder);
}
