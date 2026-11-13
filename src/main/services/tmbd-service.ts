import { MovieImage } from "../types/movies";
import { TMBDDetails, TMBDImage, TMBDMovieImages, TMBDResult, TMBDSearch } from "../types/tmdb";
import { pathToCacheURL } from "../utils/common";
import { getCachedImage, readJsonCache, writeImageCache, writeJsonCache } from "./cache-service";
import { loadConfig } from "./config-service";

const config = loadConfig();

const TMDB_API_KEY = config.tmdbApiKey;

/**
 * Searches for movies on TMDB based on the provided query and returns an array of search results. 
 * If an error occurs during the search, it logs the error and returns an empty array.
 * @async
 * @param {string} query - The search query for the movie title.
 * @returns {Promise<TMBDResult[]>} An array of TMBDResult objects containing the search results.
 * @throws {Error} Throws an error if the TMDB request fails.
 */
export async function searchMovies(query: string): Promise<TMBDResult[]> {
    const url = new URL("https://api.themoviedb.org/3/search/movie");

    url.searchParams.append("query", query);
    url.searchParams.append("language", "en-US");
    url.searchParams.append("include_adult", "false");
    url.searchParams.append("page", "1");

    const response = await fetch(url, {
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error(`TMDB request failed (${response.status} ${response.statusText})`);
    }

    const results: TMBDSearch = await response.json();

    return results.results;
}

/**
 * Fetches movie posters from TMDB for a given movie ID and returns an array of MovieImage objects.
 * If an error occurs during the fetch, it logs the error and returns an empty array.
 * @async
 * @param {number} tmdbId - The TMDB ID of the movie for which to fetch posters.
 * @param {string} type - The type of images to fetch ("poster" or "backdrop").
 * @returns {Promise<MovieImage[]>} A promise that resolves to an array of MovieImage objects.
 */
export async function getMovieImages(tmdbId: number, type: string): Promise<MovieImage[]> {

    let images = await readJsonCache<TMBDMovieImages>("movies-images", tmdbId.toString());

    if (!images) {
        const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}/images`);

        const response = await fetch(url,
            {
                headers: {
                    accept: "application/json",
                    Authorization: `Bearer ${TMDB_API_KEY}`,
                },
            },
        );

        if (!response.ok) {
            throw new Error(`TMDB request failed (${response.status} ${response.statusText})`);
        }

        images = await response.json() as TMBDMovieImages;

        try {
            await writeJsonCache<TMBDMovieImages>("movies-images", tmdbId.toString(), images);
        } catch (error) {
            console.warn(`Failed to cache movie images for ${tmdbId}:`, error);
        }
    }

    const posters: MovieImage[] = images.posters.map((poster: TMBDImage) => ({
        file: poster.file_path,
        language: poster.iso_639_1,
        width: poster.width,
        height: poster.height,
        type: "poster",
    }));

    const backdrops: MovieImage[] = images.backdrops.map((backdrop: TMBDImage) => ({
        file: backdrop.file_path,
        language: backdrop.iso_639_1,
        width: backdrop.width,
        height: backdrop.height,
        type: "backdrop",
    }));

    if (type === "poster") return posters;
    else if (type === "backdrop") return backdrops;
    else throw new Error(`Invalid image type: ${type}`);
}

/**
 * Fetches detailed movie information from TMDB for a given movie ID and caches it. If the data is already cached, it retrieves it from the cache.
 * @async
 * @param {number} tmdbId - The TMDB ID of the movie to fetch information for.
 * @param {string} cacheKey - The cache key to use for storing the movie information.
 * @returns {Promise<TMBDDetails>} A promise that resolves to the detailed movie information or undefined if an error occurs.
 * @throws {Error} Throws an error if the TMDB request fails.
 */
export async function getMovieInfo(tmdbId: number, cacheKey: string): Promise<TMBDDetails> {

    const url = `https://api.themoviedb.org/3/movie/${tmdbId}`;

    const response = await fetch(url, {
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error(
            `TMDB request failed (${response.status} ${response.statusText})`
        );
    }

    const info = await response.json() as TMBDDetails;

    try {
        await writeJsonCache<TMBDDetails>("movies", cacheKey, info);
    } catch (error) {
        console.warn(`Failed to cache movie ${tmdbId}:`, error);
    }

    return info;
}

/**
 * Fetches an image from TMDB based on the provided image path and caches it. If the image is already cached, it retrieves it from the cache.
 * @async
 * @param {string} imagePath - The path of the image to fetch from TMDB.
 * @returns {Promise<string>} A promise that resolves to the cached image URL or the original image URL if caching fails.
 * @throws {Error} Throws an error if the image request fails.
 */
export async function getTMDBImage(imagePath: string): Promise<{ path: string, filename: string }> {
    const imageUrl = `https://image.tmdb.org/t/p/original${imagePath}`;

    let image = await getCachedImage("movies", imageUrl);

    if (!image) {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`Image request failed (${response.status} ${response.statusText})`);
        }

        const imageData = await response.arrayBuffer();

        try {
            image = await writeImageCache("movies", imageUrl, imageData);
        } catch (error) {
            console.warn(`Failed to cache image ${imageUrl}:`, error);
        }
    }

    return image ? { path: pathToCacheURL(image), filename: imagePath } : { path: imageUrl, filename: imagePath };
}

