import { app, BrowserWindow, ipcMain, IpcMainEvent, session } from "electron";
import path from "node:path";
import AdmZip from 'adm-zip';
import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { hiddenWindow, normalizeTitle } from "../utils/common";
import { getAllMovies, getMovieByField, updateMovie } from "../database/services/movie-db-service";
import { ResultResponse } from "../types/common";
import { LetterboxdReview, RatingRow } from "../types/letterboxd";


const SIGN_IN_URL = "https://letterboxd.com/sign-in/";
const EXPORT_URL = "https://letterboxd.com/settings/data/";

const SITE = "https://letterboxd.com";
const AUTH_COOKIE = "letterboxd.user";
const USERNAME_COOKIE = "letterboxd.signed.in.as";
const AUTH_COOKIES = [AUTH_COOKIE, 'letterboxd.user.CURRENT', USERNAME_COOKIE];

export const PARTITION = "persist:letterboxd";

const ses = () => session.fromPartition(PARTITION);

async function getLetterboxdUsername(): Promise<string | null> {
    const [cookie] = await ses().cookies.get({ url: SITE, name: USERNAME_COOKIE });
    return cookie?.value || null;
}

export async function isLoggedInToLetterboxd(): Promise<string | null> {
    const cookies = await ses().cookies.get({ url: SITE, name: AUTH_COOKIE });
    return cookies.length > 0 ? await getLetterboxdUsername() : null;
}

export async function loginToLetterboxd(parent: BrowserWindow): Promise<string | null> {
    if (await isLoggedInToLetterboxd()) return await getLetterboxdUsername();

    return new Promise((resolve) => {
        const win = new BrowserWindow({
            width: 1200,
            height: 800,
            parent,
            webPreferences: {
                partition: PARTITION,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            }
        });

        const cookies = ses().cookies;
        let finished = false;

        const onCookieChanged = (_event: Electron.Event, cookie: Electron.Cookie, _cause: string, removed: boolean) => {
            if (!removed && cookie.name === AUTH_COOKIE) checkLogin(true);
        }

        const checkLogin = async (ok: boolean) => {
            if (finished) return;
            finished = true;
            cookies.removeListener("changed", onCookieChanged);
            const username = ok ? await getLetterboxdUsername() : null;
            resolve(username);
            if (!win.isDestroyed()) win.close();
        }

        cookies.on("changed", onCookieChanged);

        win.on("closed", () => {
            checkLogin(false);
        });

        win.loadURL(SIGN_IN_URL).catch(() => { })
    })
}
export async function logoutFromLetterboxd(): Promise<void> {
    await Promise.all(AUTH_COOKIES.map(cookieName => ses().cookies.remove(SITE, cookieName)));
}

function extractRatingsFromFile(zipPath: string): RatingRow[] {
    const csv = new AdmZip(zipPath).getEntry("ratings.csv");
    if (!csv) throw new Error("Ratings CSV not found in the ZIP file");
    const text = csv.getData().toString("utf-8");
    const ratings = parse(text, { columns: true, skip_empty_lines: true, bom: true }) as RatingRow[];
    return ratings;
}

async function matchAndUpdateRatings(file: string): Promise<number> {
    const movies = getAllMovies();

    const ratings = extractRatingsFromFile(file);

    const index = new Map<string, RatingRow[]>();
    for (const rating of ratings) {
        const key = normalizeTitle(rating.Name);
        index.set(key, [...(index.get(key) || []), rating]);
    }

    let updated: number = 0;

    for (const movie of movies) {
        const key = normalizeTitle(movie.title || movie.folder);
        const candidates = index.get(key);
        if (!candidates?.length) continue;

        const movieYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : undefined;
        let pick: RatingRow | undefined;

        if (candidates && movieYear) {
            pick = candidates
                .filter((c) => Math.abs(Number(c.Year) - Number(movieYear)) <= 1)
                .sort((a, b) => Math.abs(Number(a.Year) - Number(movieYear)) - Math.abs(Number(b.Year) - Number(movieYear)))[0];
        } else {
            pick = candidates?.[0];
        }

        if (pick) {
            if (movie.rating === Number(pick.Rating)) continue;
            updated++;
            updateMovie(movie.id, { rating: Number(pick.Rating) });
        }
    }

    return updated;
}

export async function importRatingsFromLetterboxd(parent: BrowserWindow): Promise<number | null> {
    if (!await isLoggedInToLetterboxd()) return null;

    const dir = path.join(app.getPath("userData"), "data", "letterboxd");
    const target = path.join(dir, "letterboxd-export.zip");

    return new Promise((resolve) => {
        const win = new BrowserWindow({
            width: 1200,
            height: 800,
            parent,
            webPreferences: {
                partition: PARTITION,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            }
        });

        const ses = win.webContents.session;
        let finished = false;

        const finish = (imported: number) => {
            if (finished) return;
            finished = true;
            ses.removeListener("will-download", onDownload);
            resolve(imported);
            if (!win.isDestroyed()) win.close();
        }

        const onDownload = (_event: Electron.Event, item: Electron.DownloadItem, webContents: Electron.WebContents) => {
            if (webContents.id !== win.webContents.id) return;

            if (!item.getFilename().endsWith(".zip")) {
                item.cancel();
                return;
            }

            item.setSavePath(target);
            item.once("done", async (_event, state) => {
                try {
                    if (state === "completed" && !finished) finish(await matchAndUpdateRatings(target));
                    else finish(0);
                } catch (error) {
                    console.error("Error processing ratings import:", error);
                    finish(0);
                } finally {
                    await fs.rm(target, { force: true });
                }
            });
        }

        ses.on("will-download", onDownload);
        win.on("closed", () => finish(0));
        win.loadURL(EXPORT_URL).catch(() => { })
    });
}

async function openReviewWindow(win: BrowserWindow, movieId: number): Promise<boolean> {
    const movie = getMovieByField("id", movieId.toString());
    if (!movie?.tmbdId) return false;

    try {
        await win.loadURL(`https://letterboxd.com/tmdb/${movie?.tmbdId}/`);
    } catch (error) { }

    if (win.isDestroyed()) return false;

    const filmUrl = new URL(win.webContents.getURL());
    if (!filmUrl.pathname.startsWith("/film/")) return false;
    const reviewUrl = `${filmUrl.origin}${filmUrl.pathname}review/`;

    try {
        await win.loadURL(reviewUrl);
    } catch (error) {
        console.error("Error loading Letterboxd review page:", error);
        return false;
    }

    if (win.isDestroyed()) return false;

    win.show();
    return false;
}

export async function makeReviewOnLetterboxd(parent: BrowserWindow, movieId: number): Promise<ResultResponse> {
    return new Promise((resolve) => {
        const win = new BrowserWindow({
            width: 1200,
            height: 800,
            show: false,
            parent,
            webPreferences: {
                partition: PARTITION,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
                preload: path.join(__dirname, "../../preload/preload-review.js"),
            }
        });

        const ses = win.webContents.session;
        const webContentsId = win.webContents.id;
        let finished = false;
        let pending: LetterboxdReview | null = null;

        const onReviewSubmitted = (e: IpcMainEvent, review: LetterboxdReview) => {
            if (e.sender !== win.webContents) return;
            pending = review;
            try {
                updateMovie(movieId, { rating: review.rating });
            } catch (error) {
                console.error("Failed to save the Letterboxd rating locally:", error);
            }
        }
        ipcMain.on("letterboxdReviewSubmitted", onReviewSubmitted);

        const finish = (data: LetterboxdReview | null) => {
            if (finished) return;
            finished = true;
            ipcMain.removeListener("letterboxdReviewSubmitted", onReviewSubmitted);
            ses.webRequest.onCompleted(null);
            resolve({
                success: data !== null,
                message: data ? "Review submitted successfully." : "Failed to submit the review.",
            });
            if (!win.isDestroyed()) win.close();
        }

        ses.webRequest.onCompleted({ urls: [`${SITE}/*`] }, (details) => {
            if (details.webContentsId !== webContentsId) return;
            if (!details.url.includes("/api/v0/production-log-entries")) return;
            if (details.statusCode < 400) finish(pending);
            else finish(null);
        });

        win.on('closed', () => finish(null));

        openReviewWindow(win, movieId).then((opened) => {
            if (!opened) finish(null);
        });
    })
}

