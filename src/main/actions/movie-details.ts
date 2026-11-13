import path from "node:path";
import { getMovieByField, updateMovie } from "../database/services/movie-db-service";
import { loadConfig } from "../services/config-service";
import { getMovieMetadata, getSubtitleLanguage } from "../services/metadata-service";
import { formatMovieFolder } from "../services/movies-service";
import { ResultResponse } from "../types/common";
import { MovieLocalSubtitle, MovieMetadata } from "../types/movies";

const config = loadConfig();

const MOVIES_FOLDER = config.moviesFolder;
const preferredAudioLanguages = config.preferences.audioLanguage || ["eng"];
const preferredSubtitleLanguages = config.preferences.subtitleLanguage || ["eng"];

export async function updateMovieFiles(movieId: number, folder: string): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());

    if (!movie) return { success: false, message: "Movie not found" };

    const formattedFolder = formatMovieFolder(folder);
    const folderPath = path.join(MOVIES_FOLDER, folder);

    if (!formattedFolder) return { success: false, message: "Invalid movie folder" };

    let metadata: MovieMetadata | undefined;

    try {
        metadata = await getMovieMetadata(folderPath, formattedFolder!.videoFile);
    } catch (error) {
        console.error(`Failed to get metadata for movie "${folder}":`, error);
    }

    let subtitleFiles: MovieLocalSubtitle[] = [];

    if (formattedFolder.subtitlesFiles.length > 0) {
        subtitleFiles = formattedFolder.subtitlesFiles.map((subtitleFile, index) => {
            try {
                const language = getSubtitleLanguage(folderPath, subtitleFile);
                return {
                    file: subtitleFile,
                    language: `${language}-${index + 1}`,
                };
            } catch (error) {
                console.error(`Failed to read subtitle language for movie "${folder}" and subtitle file "${subtitleFile}":`, error);
                return {
                    file: subtitleFile,
                    language: `und-${index + 1}`,
                };
            }
        });
    }

    const selectPreferredLanguage = (available: string[], preferred: string[]): string => {
        for (let preferredLang of preferred) {
            if (preferredLang === "original") preferredLang = movie.originalLanguage || "";
            for (const availableLang of available) {
                if (availableLang.split("-")[0] === preferredLang) {
                    return availableLang;
                }
            }
        }
        return available[0] || "";
    };

    const availableSubtitleLanguages = [
        ...new Set([
            ...subtitleFiles.map((subtitle) => subtitle.language),
            ...(metadata?.subtitleLanguages || [])
        ])
    ];
    const selectedAudioLanguage = selectPreferredLanguage(metadata?.audioLanguages || [], preferredAudioLanguages);
    const selectedSubtitleLanguage = selectPreferredLanguage(availableSubtitleLanguages || [], preferredSubtitleLanguages);

    updateMovie(movieId, {
        videoFile: formattedFolder.videoFile,
        subtitleFiles: JSON.stringify(subtitleFiles),
        resolution: JSON.stringify(metadata?.resolution || { tag: "", width: 0, height: 0 }),
        videoCodec: metadata?.videoCodec || "",
        audioCodecs: JSON.stringify(metadata?.audioCodecs || []),
        audioLanguages: JSON.stringify(metadata?.audioLanguages || []),
        subtitleLanguages: JSON.stringify(metadata?.subtitleLanguages || []),
        selectedAudioLanguage: selectedAudioLanguage,
        selectedSubtitleLanguage: selectedSubtitleLanguage,
    });

    return { success: true, message: "Movie data updated successfully" };
}