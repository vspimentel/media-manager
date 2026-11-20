import './setup'
import path from "path";
import { app, protocol, net, BrowserWindow } from "electron";
import { ipcMainHandle } from "./utils/electron";
import { getMovie, getMovies } from "./services/movies-service";
import { pathToFileURL } from "url";
import { initializeDatabase } from "./database";
import { isDev } from './utils/common';
import { getMovieImages, searchMovies } from './services/tmbd-service';
import { calculateMovieHash, changeMovie, changeMovieImage, playMovie, updateMovieFiles } from './actions/movie';
import { importRatingsFromLetterboxd, isLoggedInToLetterboxd, loginToLetterboxd, logoutFromLetterboxd, makeReviewOnLetterboxd } from './services/letterboxd-service';
import { searchSubtitles } from './services/open-subtitles-service';
import { getConfig } from './services/config-service';
import { addSubtitleFile, saveSubtitleFile, testSubtitle } from './actions/subtitles';
import { addDownloadLink, addTorrentFile, deleteSource } from './actions/sources';
import { openExternalLink, openFolder, openLocalFile } from './actions/general';

async function createWindow() {
  const win = new BrowserWindow({
    frame: false,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.maximize();

  if (isDev()) {
    await win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }

  // Window controls
  ipcMainHandle("windowMinimize", () => {
    win.minimize();
    return true;
  });

  ipcMainHandle("windowToggleMaximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
    return win.isMaximized();
  });

  ipcMainHandle("windowClose", () => {
    win.close();
    return true;
  });

  ipcMainHandle("windowIsMaximized", () => {
    return win.isMaximized();
  });

  // General services
  ipcMainHandle("getConfig", async () => {
    return getConfig();
  });

  ipcMainHandle("openLocalFile", async (args) => {
    return await openLocalFile(args.library, args.folder, args.file);
  });

  ipcMainHandle("openExternalLink", async (args) => {
    return await openExternalLink(args.url);
  });

  ipcMainHandle("openFolder", async (args) => {
    return await openFolder(args.library, args.folder);
  });

  // Movie services
  ipcMainHandle("getMovies", async (args) => {
    return await getMovies(args.update, args.sortBy, args.sortDirection);
  });

  ipcMainHandle("getMovie", async (args) => {
    return await getMovie(args.id);
  });

  ipcMainHandle("searchMovies", async (args) => {
    return await searchMovies(args.title);
  });

  ipcMainHandle("getMovieImages", async (args) => {
    return await getMovieImages(args.tmbdId, args.type);
  });

  // Options services
  ipcMainHandle("isLoggedInToLetterboxd", async () => {
    return await isLoggedInToLetterboxd();
  });

  ipcMainHandle("loginToLetterboxd", async () => {
    return await loginToLetterboxd(win);
  });

  ipcMainHandle("logoutFromLetterboxd", async () => {
    return await logoutFromLetterboxd();
  });

  ipcMainHandle("importRatingsFromLetterboxd", async () => {
    return await importRatingsFromLetterboxd(win);
  });

  ipcMainHandle("makeReviewOnLetterboxd", async (args) => {
    return await makeReviewOnLetterboxd(win, args.movieId);
  });

  // Movie actions
  ipcMainHandle("playMovie", async (args) => {
    return await playMovie(args.movieId, args.subtitleLanguage, args.audioLanguage);
  });

  ipcMainHandle("changeMovie", async (args) => {
    return await changeMovie(args.movieId, args.tmbdId);
  });

  ipcMainHandle("changeMovieImage", async (args) => {
    return await changeMovieImage(args.movieId, args.imagePath, args.type);
  });

  ipcMainHandle("updateMovieFiles", async (args) => {
    return await updateMovieFiles(args.movieId, args.folder);
  });

  ipcMainHandle("calculateMovieHash", async (args) => {
    return await calculateMovieHash(args.movieId);
  });

  // Subtitles actions
  ipcMainHandle("searchSubtitles", async (args) => {
    return await searchSubtitles(args.movieId, args.language);
  });

  ipcMainHandle("addSubtitleFile", async (args) => {
    return await addSubtitleFile(args.movieId, args.folder, args.sourcePath);
  });

  ipcMainHandle("testSubtitle", async (args) => {
    return await testSubtitle(args.movieId, args.subtitleFileId);
  });

  ipcMainHandle("saveSubtitleFile", async (args) => {
    return await saveSubtitleFile(args.movieId, args.subtitleFileId, args.subtitleFileName);
  });

  // Source actions
  ipcMainHandle("addTorrentFile", async (args) => {
    return await addTorrentFile(args.movieId, args.folder, args.sourcePath);
  });

  ipcMainHandle("addDownloadLink", async (args) => {
    return await addDownloadLink(args.movieId, args.link);
  });

  ipcMainHandle("deleteSource", async (args) => {
    return await deleteSource(args.movieId, args.sourceType, args.sourceValue);
  });
}

// Register the "cache" protocol to handle requests for cached images
protocol.registerSchemesAsPrivileged([
  {
    scheme: "cache",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

app.whenReady().then(async () => {

  //Create a cache directory in the user data path
  const cacheDir = path.join(app.getPath("userData"), "Cache");
  protocol.handle("cache", (request) => {
    const url = new URL(request.url);
    const fileName = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const filePath = path.join(cacheDir, fileName);

    if (!filePath.startsWith(cacheDir + path.sep)) {
      return new Response("Forbidden", { status: 403 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  initializeDatabase();
  await createWindow();
}).catch((err) => {
  console.error("Failed to create window:", err);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
