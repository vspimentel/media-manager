import { app } from "electron";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';
import path from "node:path";

/**
 * Creates a directory if it does not exist.
 * @async
 * @param {string} directory The directory path to ensure exists.
 * @returns {Promise<void>}
 */
export async function ensureDirectory(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
}

/**
 * Creates a SHA-256 hash of the given value.
 * @param {string} value The value to hash.
 * @returns {string} The SHA-256 hash of the given value.
 */
export function hash(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}


/**
 * Converts an absolute file path to a cache URL that can be used in the application.
 * @param {string} absolutePath The absolute file path to convert.
 * @returns {string} The cache URL corresponding to the given absolute file path.
 */
export function pathToCacheURL(absolutePath: string): string {
  const cacheDir = path.join(app.getPath("userData"), "Cache");
  const relative = path.relative(cacheDir, absolutePath).split(path.sep);
  return `cache://local/${relative.map(encodeURIComponent).join("/")}`;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
