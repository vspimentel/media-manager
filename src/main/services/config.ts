import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { AppConfig } from "../types/common";

export function loadConfig(): AppConfig {
  const configPath = path.join(
    app.getPath("userData"),
    "config",
    "config.json",
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config file not found: ${configPath}`,
    );
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as AppConfig;

  return {
    tmdbApiKey: config.tmdbApiKey ? config.tmdbApiKey : "",
    moviesDir: config.moviesDir ? config.moviesDir : path.join("D:", "Movies"),
  };
}