import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // Movie services
  getMovies: (update: boolean, sortBy: string, sortDirection: string) => ipcInvoke("getMovies", { update, sortBy, sortDirection }),
  getMovie: (id: number) => ipcInvoke("getMovie", { id }),
  searchMovies: (title: string) => ipcInvoke("searchMovies", { title }),
  getMovieImages: (tmbdId: number, type: string) => ipcInvoke("getMovieImages", { tmbdId, type }),

  // Movie actions
  openMovieFolder: (folder: string) => ipcInvoke("openMovieFolder", { folder }),
  playMovie: (folder: string, videoFile: string, subtitleLanguage: string, audioLanguage: string) => ipcInvoke("playMovie", { folder, videoFile, subtitleLanguage, audioLanguage }),
  openSubtitlesFile: (folder: string, subtitlesFile: string) => ipcInvoke("openSubtitlesFile", { folder, subtitlesFile }),
  changeMovie: (movieId: number, tmbdId: number) => ipcInvoke("changeMovie", { movieId, tmbdId }),
  changeMovieImage: (movieId: number, imagePath: string, type: string) => ipcInvoke("changeMovieImage", { movieId, imagePath, type }),

  // Movie details actions
  updateMovieFiles: (movieId: number, folder: string) => ipcInvoke("updateMovieFiles", { movieId, folder }),
  addSubtitleFile: (movieId: number, folder: string, file: File) => ipcInvoke("addSubtitleFile", { movieId, folder, sourcePath: webUtils.getPathForFile(file) }),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  ...args: EventRequestMapping[Key] extends void
    ? []
    : [payload: EventRequestMapping[Key]]
): Promise<EventPayloadMapping[Key]> {
  return ipcRenderer.invoke(key, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void,
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
  ipcRenderer.on(key, cb);
  return () => ipcRenderer.off(key, cb);
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key],
) {
  ipcRenderer.send(key, payload);
}
