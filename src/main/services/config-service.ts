import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { AppConfig } from "../types/common";

/**
 * Loads the application configuration from the config.json file.
 * @returns {AppConfig} The application configuration.
 * @throws {Error} Throws an error if the config file does not exist or cannot be read.
 */
export function loadConfig(): AppConfig {
  const configPath = path.join(
    app.getPath("userData"),
    "config",
    "config.json"
  );

  if (!fs.existsSync(configPath)) throw new Error(`Config file not found: ${configPath}`);

  const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as AppConfig;

  return {
    tmdbApiKey: config.tmdbApiKey ? config.tmdbApiKey : "",
    moviesFolder: config.moviesFolder ? config.moviesFolder : path.join("D:", "Movies"),
    VLCPath: config.VLCPath ? config.VLCPath : "",
    preferences: {
      audioLanguage: config.preferences?.audioLanguage ? config.preferences.audioLanguage : [],
      subtitleLanguage: config.preferences?.subtitleLanguage ? config.preferences.subtitleLanguage : [],
    }
  };
}