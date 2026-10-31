import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // Movie services
  getMovies: () => ipcInvoke("getMovies"),
  searchMovies: (title: string) => ipcInvoke("searchMovies", { title }),

  // Movie actions
  openMovieFolder: (folderName: string) => ipcInvoke("openMovieFolder", { folderName }),
  changeMovie: (movieId: number, tmbdId: number) => ipcInvoke("changeMovie", { movieId, tmbdId }),
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
