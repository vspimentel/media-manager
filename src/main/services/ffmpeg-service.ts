import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MovieMetadata } from "../types/movies";
import fs from "node:fs/promises";
import ffprobeStatic from "ffprobe-static";
import { ProbeData } from "../types/ffmpeg";
import path from "node:path";
import prettyBytes from "pretty-bytes";
import langs from "langs";


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



function getResolutionTag(height: number): string {

    if (height >= 4100) return "8K";
    if (height >= 2050) return "4K";
    if (height >= 1370) return "2K";
    if (height >= 1020) return "1080p";
    if (height >= 680) return "720p";
    if (height >= 450) return "480p";

    return "SD";
}