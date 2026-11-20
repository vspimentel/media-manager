import path from "node:path";
import { getMovieByField, updateMovie } from "../database/services/movie-db-service";
import { getMovieMetadata, getSubtitleLanguage, ohash } from "../services/metadata-service";
import { formatMovieFolder } from "../services/movies-service";
import { DownloadSource, ResultResponse, SubtitleFile } from "../types/common";
import { MovieMetadata } from "../types/movies";
import { shell } from "electron";
import { getConfig } from "../services/config-service";
import { getMovieInfo, getTMDBImage } from "../services/tmbd-service";
import { spawn } from "node:child_process";
import langs from "langs";

const config = getConfig();

const MOVIES_FOLDER = config.moviesFolder;
const VLC_PATH = config.VLCPath;
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

    let subtitleFiles: SubtitleFile[] = [];

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


    let sources: DownloadSource[] = [];

    if (formattedFolder.torrentFiles.length > 0) {
        sources = formattedFolder.torrentFiles.map((torrentFile) => ({
            type: "torrent",
            source: torrentFile,
        }));
    }

    updateMovie(movieId, {
        filesize: metadata?.filesize || 0,
        videoFile: formattedFolder.videoFile,
        subtitleFiles: JSON.stringify(subtitleFiles),
        sources: JSON.stringify(sources),
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


/**
 * Plays a movie file using the default system player.
 * @async
 * @param movieId {number} The ID of the movie to play.
 * @param subtitle {string} The language code of the subtitle to use, or the name of the subtitle file.
 * @param audio {string} The language code of the audio track to use.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function playMovie(movieId: number, subtitle: string, audio: string): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());

    if (!movie) {
        return { success: false, message: "Movie not found." };
    }

    const filePath = path.resolve(MOVIES_FOLDER, movie.folder, movie.videoFile);
    const root = path.resolve(MOVIES_FOLDER);

    if (!filePath.startsWith(root + path.sep)) return { success: false, message: "Invalid file path" };

    const args: string[] = [filePath];

    if (audio !== "und" && audio !== "") {
        const audioCode = langs.where("1", audio)?.["2B"] || audio;
        args.push(`--audio-language=${audioCode}`);
    }

    args.push("--no-sub-autodetect-file");

    if (subtitle.includes('.')) {
        const subtitleFilePath = path.resolve(MOVIES_FOLDER, movie.folder, subtitle);
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

export async function calculateMovieHash(movieId: number): Promise<ResultResponse> {
    const movie = getMovieByField("id", movieId.toString());

    if (!movie) return { success: false, message: `Movie with ID ${movieId} not found` };

    const root = path.resolve(MOVIES_FOLDER);
    const file = path.resolve(root, movie.folder, movie.videoFile);

    let ohashValue: string;

    try {
        ohashValue = ohash(file);
    } catch (error) {
        throw new Error(`Failed to compute ohash for file "${file}": ${error}`);
    }

    updateMovie(movieId, { ohash: ohashValue });

    return { success: true };
}
