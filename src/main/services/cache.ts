import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import { ensureDirectory, hash } from "../utils/general";
import console from "node:console";

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Gets the root directory for cache storage.
 * @returns {string} The root directory for cache storage.
 */
function cacheRoot(): string {
  return path.join(app.getPath("userData"), "Cache");
}

/**
 * Reads a JSON file from the cache if it exists and is not expired.
 * If the file does not exist or is expired, the file is deleted and undefined is returned.
 * @async
 * @param dir The directory within the cache.
 * @param key The key used to generate the filename.
 * @returns {Promise<T | undefined>} The parsed JSON object or undefined if the file does not exist or is expired.
 */
export async function readJsonCache<T>(dir: string, key: string): Promise<T | undefined> {
  const filePath = path.join(cacheRoot(), "data", dir, `${hash(key)}.json`);

  try {
    const stats = await fs.stat(filePath);

    if (Date.now() - stats.mtimeMs > CACHE_TTL) {
        await fs.unlink(filePath);
        return undefined;
    }

    const contents = await fs.readFile(filePath, "utf8");
    return JSON.parse(contents) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.warn(`Cache file not found: ${filePath}`);
      return undefined;
    }
    throw error;
  }
}

/**
 * Creates a JSON file in the cache with the given value.
 * @async
 * @param dir The directory within the cache.
 * @param key The key used to generate the filename.
 * @param value The value to be written to the JSON file.
 * @returns {Promise<void>}
 */
export async function writeJsonCache<T>(dir: string, key: string, value: T): Promise<void> {
  const directory = path.join(cacheRoot(), "data", dir);
  const filePath = path.join(directory, `${hash(key)}.json`);

  await ensureDirectory(directory);
  await fs.writeFile(filePath, JSON.stringify(value), "utf8");
}

/**
 * Gets a cached image file if it exists and is not expired. 
 * If the file does not exist or is expired, the file is deleted and undefined is returned.
 * @async
 * @param url The URL of the image.
 * @returns {Promise<string | undefined>} The path to the cached image file or undefined if it doesn't exist.
 */
export async function getCachedImage(dir: string, url: string): Promise<string | undefined> {
  const directory = path.join(cacheRoot(), "images", dir);
  const filePath = path.join(directory, `${hash(url)}.webp`);

  try {
    const stats = await fs.stat(filePath);

    if (Date.now() - stats.mtimeMs > CACHE_TTL) {
        await fs.unlink(filePath);
        return undefined;
    }

    return filePath;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

/**
 * Writes an image to the cache.
 * @async
 * @param dir The directory within the cache.
 * @param url The URL of the image.
 * @param bytes The image data as an ArrayBuffer.
 * @returns The path to the cached image file.
 */
export async function writeImageCache(dir: string, url: string, bytes: ArrayBuffer): Promise<string> {
  const directory = path.join(cacheRoot(), "images", dir);
  const filePath = path.join(directory, `${hash(url)}.webp`);

  await ensureDirectory(directory);
  await fs.writeFile(filePath, Buffer.from(bytes));

  return filePath;
}