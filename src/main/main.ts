import { app, protocol, net, BrowserWindow } from "electron";
import path from "path";
import './setup'
import { ipcMainHandle, isDev } from "./utils/electron";
import { getMovies } from "./services/movies";
import { pathToFileURL } from "url";

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
  } else {
    win.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }

  ipcMainHandle("getMovies", async () => {
    return await getMovies();
  });
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "cache",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

app.whenReady().then(() => {
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
