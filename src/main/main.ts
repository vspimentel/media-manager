import { app, protocol, net, BrowserWindow } from "electron";
import path from "path";
import './setup'
import { ipcMainHandle, isDev } from "./utils/electron";
import { getMovies, searchMovies } from "./services/movies";
import { pathToFileURL } from "url";
import { openMovieFolder } from "./actions/movieItem";

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
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }

  // Movies services
  ipcMainHandle("getMovies", async () => {
    return await getMovies();
  });

  ipcMainHandle("searchMovies", async (title) => {
    return await searchMovies(title);
  });
  
  // Movies actions
  ipcMainHandle("openMovieFolder", async (folderName) => {
    await openMovieFolder(folderName);
  });
}

// Register the "cache" protocol to handle requests for cached images
protocol.registerSchemesAsPrivileged([
  {
    scheme: "cache",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

app.whenReady().then(() => {

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

  createWindow()
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
