import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const Movie = sqliteTable("movies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  folder: text("folder").notNull().unique(),
  videoFile: text("video_file").notNull(),
  subtitleFiles: text("subtitle_files"),
  filesize: integer("filesize"),
  resolution: text("resolution"),
  videoCodec: text("video_codec"),
  audioCodecs: text("audio_codecs"),
  audioLanguages: text("audio_languages"),
  subtitleLanguages: text("subtitle_languages"),
  selectedAudioLanguage: text("selected_audio_language"),
  selectedSubtitleLanguage: text("selected_subtitle_language"),
  cacheKey: text("cache_key"),
  tmbdId: integer("tmdb_id"),
  title: text("title"),
  originalTitle: text("original_title"),
  originalLanguage: text("original_language"),
  tagline: text("tagline"),
  overview: text("overview"),
  releaseDate: text("release_date"),
  duration: text("duration"),
  voteAverage: real("vote_average"),
  voteCount: integer("vote_count"),
  poster: text("poster"),
  posterFilename: text("poster_filename"),
  backdrop: text("backdrop"),
  backdropFilename: text("backdrop_filename"),
  genres: text("genres"),
  countries: text("countries")
});

export type Movie = typeof Movie.$inferSelect;
export type NewMovie = typeof Movie.$inferInsert;