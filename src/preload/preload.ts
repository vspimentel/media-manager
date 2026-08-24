import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // expose safe APIs to renderer here
});
