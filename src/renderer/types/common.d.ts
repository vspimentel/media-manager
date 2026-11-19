export type AppConfig = {
    tmdbApiKey: string;
    openSubtitlesApiKey: string;
    moviesFolder: string;
    VLCPath: string;
    preferences: {
        audioLanguage: string[];
        subtitleLanguage: string[];
    }
};