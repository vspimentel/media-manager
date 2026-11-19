import { getMovieByField } from "../database/services/movie-db-service";
import { OpenSubtitlesDownloadResponse, OpenSubtitlesSearchResult, SubtitleDownloadResult } from "../types/open-subtitles";
import { getCachedFile, writeFileCache } from "./cache-service";
import { getConfig } from "./config-service";

const config = getConfig();

const OPEN_SUBTITLES_API_KEY = config.openSubtitlesApiKey;

/**
 * Searches for movies on OpenSubtitles based on the provided movie ID and language.
 * @async
 * @param {string} movieId - The ID of the movie to search for.
 * @param {string} language - The language of the subtitles to search for.
 * @returns {Promise<OpenSubtitlesSearchResult>} A promise that resolves to the search results.
 * @throws {Error} Throws an error if the OpenSubtitles request fails.
 */
export async function searchSubtitles(movieId: number, language: string): Promise<OpenSubtitlesSearchResult> {
    const url = new URL("https://api.opensubtitles.com/api/v1/subtitles");

    const movie = getMovieByField("id", movieId.toString());

    if (!movie || !movie.tmbdId || !movie.ohash) return { total_pages: 0, total_count: 0, page: 1, data: [] };

    url.searchParams.append("tmdb_id", movie.tmbdId.toString());
    url.searchParams.append("languages", language);
    url.searchParams.append("moviehash", movie.ohash);

    const response = await fetch(url, {
        headers: {
            "Api-Key": OPEN_SUBTITLES_API_KEY,
        },
    });

    if (!response.ok) {
        throw new Error(`OpenSubtitles request failed (${response.status} ${response.statusText})`);
    }

    const results: OpenSubtitlesSearchResult = await response.json();

    return results;
}

export async function getSubtitleFile(fileId: number): Promise<SubtitleDownloadResult> {

    let filename = await getCachedFile("subtitles", `${fileId}.srt`);

    if (filename) {
        return {
            filename,
            reset: null,
        };
    }

    const response = await fetch(
        "https://api.opensubtitles.com/api/v1/download",
        {
            method: "POST",
            headers: {
                "Api-Key": OPEN_SUBTITLES_API_KEY,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                file_id: fileId,
                sub_format: "srt",
                file_name: `${fileId}.srt`,
            }),
        }
    );

    const data: OpenSubtitlesDownloadResponse = await response.json();

    if (response.status === 406) {
        return {
            filename: null,
            reset: data.reset_time,
        };
    }

    if (!response.ok) {
        throw new Error(`Download link request failed (${response.status} ${response.statusText})`);
    }

    const subtitleData = await fetch(data.link);

    if (!subtitleData.ok) {
        throw new Error(`Subtitle file download failed (${subtitleData.status} ${subtitleData.statusText})`);
    }

    try {
        const filename = await writeFileCache("subtitles", `${fileId}.srt`, await subtitleData.arrayBuffer());
        return {
            filename,
            reset: null,
        };
    } catch (error) {
        throw new Error(`Failed to save subtitle file: ${error}`);
    }
}