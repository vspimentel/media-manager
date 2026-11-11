import './setup'
import path from "path";
import { app, protocol, net, BrowserWindow } from "electron";
import { ipcMainHandle } from "./utils/electron";
import { getMovie, getMovies } from "./services/movies-service";
import { pathToFileURL } from "url";
import { changeMovie, changeMoviePoster, openMovieFolder, openSubtitlesFile, playMovie } from "./actions/movie-item";
import { initializeDatabase } from "./database";
import { isDev } from './utils/common';
import { getMovieImages, searchMovies } from './services/tmbd-service';

async function createWindow() {
  const win = new BrowserWindow({
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

  // Movies services
  ipcMainHandle("getMovies", async (args) => {
    return await getMovies(args.update);
  });

  ipcMainHandle("getMovie", async (args) => {
    return await getMovie(args.id);
  });

  ipcMainHandle("searchMovies", async (args) => {
    return await searchMovies(args.title);
  });

  ipcMainHandle("getMovieImages", async (args) => {
    return await getMovieImages(args.tmbdId);
  });

  // Movies actions
  ipcMainHandle("openMovieFolder", async (args) => {
    return await openMovieFolder(args.folder);
  });

  ipcMainHandle("openSubtitlesFile", async (args) => {
    return await openSubtitlesFile(args.folder, args.subtitlesFile);
  });

  ipcMainHandle("playMovie", async (args) => {
    return await playMovie(args.folder, args.videoFile, args.subtitleLanguage, args.audioLanguage);
  });

  ipcMainHandle("changeMovie", async (args) => {
    return await changeMovie(args.movieId, args.tmbdId);
  });

  ipcMainHandle("changeMoviePoster", async (args) => {
    return await changeMoviePoster(args.movieId, args.posterPath);
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
