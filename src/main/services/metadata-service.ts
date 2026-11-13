import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MovieMetadata } from "../types/movies";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import ffprobeStatic from "ffprobe-static";
import { ProbeData } from "../types/ffmpeg";
import path from "node:path";
import { franc } from "franc";
import langs from "langs";
import { loadConfig } from "./config-service";

const config = loadConfig();

const MOVIES_FOLDER = config.moviesFolder;

const execFileAsync = promisify(execFile);

export async function getMovieMetadata(folder: string, videoFile: string): Promise<MovieMetadata> {
    const filePath = path.join(folder, videoFile);

    const ffprobePath = ffprobeStatic.path;
    if (!ffprobePath) throw new Error("FFProbe binary not found");

    const [{ stdout }, file] = await Promise.all([
        execFileAsync(ffprobePath, [
            "-v", "error",
            "-show_format",
            "-show_streams",
            "-of", "json",
            filePath
        ], { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }),
        fs.stat(filePath)
    ]);

    const probe = JSON.parse(stdout) as ProbeData;
    const streams = probe.streams || [];
    const video = streams.find(stream => stream.codec_type === "video");
    const audio = streams.filter(stream => stream.codec_type === "audio");
    const subtitles = streams.filter(stream => stream.codec_type === "subtitle");

    if (!video || !audio) throw new Error("Video or audio stream not found");

    const videoResolution = getResolutionTag(video.height);
    const videoCodec = video.codec_name ? video.codec_name.trim().toUpperCase() : undefined;
    const audioCodecs = [...new Set(
        audio.flatMap(stream =>
            stream.codec_name ? [stream.codec_name.trim().toUpperCase()] : []
        )
    )];
    const audioLanguages = [...new Set(
        audio.flatMap(stream =>
            stream.tags?.language ? [
                langs.where("2B", stream.tags.language.trim())?.["1"] ||
                stream.tags.language.trim()
            ] : []
        )
    )];
    const subtitleLanguages = [...new Set(
        subtitles.flatMap(stream =>
            stream.tags?.language ? [
                langs.where("2B", stream.tags.language.trim())?.["1"] ||
                stream.tags.language.trim()
            ] : []
        )
    )];

    return {
        filesize: file.size,
        resolution: {
            tag: videoResolution,
            width: video.width,
            height: video.height
        },
        videoCodec: videoCodec,
        audioCodecs: audioCodecs,
        audioLanguages: audioLanguages,
        subtitleLanguages: subtitleLanguages
    }
}

/**
 * Determines the language of a subtitle file based on its content.
 * @param {string} folder - The path to the folder containing the subtitle file.
 * @param {string} subtitleFile - The name of the subtitle file.
 * @returns {string} The ISO 639-1 language code of the subtitle file, or "und" if the language cannot be determined.
 */
export function getSubtitleLanguage(folder: string, subtitleFile: string): string {
    const ext = path.extname(subtitleFile).toLowerCase();
    const content = fsSync.readFileSync(path.join(folder, subtitleFile), "utf-8");
    let text = "";

    if (ext === ".srt" || ext === ".vtt") {
        text = content
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter((line: string) => !/^\s*\d+\s*$/.test(line))
            .filter((line: string) => !/^\s*\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(line))
            .filter((line: string) => !/^\s*WEBVTT\s*$/.test(line))
            .join(" ")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    if (ext === ".ass" || ext === ".ssa") {
        text = content
            .split(/\r?\n/)
            .filter((line: string) => line.startsWith("Dialogue:"))
            .map((line: string) => line.slice("Dialogue:".length).split(",").slice(9).join(","))
            .join(" ")
            .replace(/\{[^}]*\}/g, " ")
            .replace(/\\N|\\n|\\h/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    text = text.slice(0, 20000);

    if (text.length < 100) return "und"
    const guess = franc(text, { minLength: 100 })
    return langs.where("3", guess)?.["1"] || "und";
}

/**
 * Determines the resolution tag based on the height of the video.
 * @param {number} height - The height of the video in pixels.
 * @returns {string} The resolution tag (e.g., "1080p", "720p", "SD").
 */
function getResolutionTag(height: number): string {
    if (height >= 4100) return "8K";
    if (height >= 2050) return "4K";
    if (height >= 1370) return "2K";
    if (height >= 1020) return "1080p";
    if (height >= 680) return "720p";
    if (height >= 450) return "480p";

    return "SD";
}