import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const Movie = sqliteTable("movies", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    duration: text("duration").notNull(),
    folder: text("folder").notNull().unique(),
    poster: text("poster"),
    tmbdId: integer("tmdb_id"),
    cacheKey: text("cache_key"),
});

export type Movie = typeof Movie.$inferSelect;
export type NewMovie = typeof Movie.$inferInsert;