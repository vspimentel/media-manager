import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'sqlite',
    schema: './src/main/database/schema',
    out: './drizzle',
    dbCredentials: {
        url: "C:\\Users\\PC\\AppData\\Roaming\\MediaManager\\database\\media-manager.sqlite",
    }
});