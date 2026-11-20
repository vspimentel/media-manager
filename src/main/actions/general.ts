import path from "node:path";
import { getConfig } from "../services/config-service";
import { ResultResponse } from "../types/common";
import { shell } from "electron";

const config = getConfig();

const MOVIES_FOLDER = config.moviesFolder;

/**
 * Opens a local file for a specific movie.
 * @param {string} folder - The name of the movie folder.
 * @param {string} file - The name of the file to open.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function openLocalFile(library: string, folder: string, file: string): Promise<ResultResponse> {
    let libraryFolder: string;

    if (library === "movies") {
        libraryFolder = MOVIES_FOLDER;
    } else {
        return { success: false, message: "Invalid library type" };
    }

    const filePath = path.resolve(libraryFolder, folder, file);
    const root = path.resolve(libraryFolder);

    if (!filePath.startsWith(root + path.sep)) {
        return { success: false, message: "Invalid file path" };
    }

    const error = await shell.openPath(filePath);

    if (error) return { success: false, message: `Failed to open local file: ${error}` };
    return { success: true };
}
export async function openExternalLink(url: string): Promise<ResultResponse> {
    try {
        const { shell } = await import("electron");
        await shell.openExternal(url);
        return { success: true };
    } catch (error) {
        return { success: false, message: "Failed to open link" };
    }
}

/**
 * Opens the folder for a specific movie.
 * @async
 * @param folder {string} The name of the movie folder to open.
 * @returns {Promise<ResultResponse>} A promise that resolves to a ResultResponse indicating success or failure of the operation.
 */
export async function openFolder(library: string, folder: string): Promise<ResultResponse> {
    let libraryFolder: string;

    if (library === "movies") {
        libraryFolder = MOVIES_FOLDER;
    } else {
        return { success: false, message: "Invalid library type" };
    }

    const root = path.resolve(libraryFolder);
    const target = path.resolve(root, folder);

    if (!target.startsWith(root + path.sep)) {
        return { success: false, message: "Invalid folder path" };
    }

    const error = await shell.openPath(target);

    if (error) return { success: false, message: `Failed to open folder: ${error}` };

    return { success: true };
}