import { getDatabase } from "..";
import { eq } from "drizzle-orm";
import { Movie, NewMovie } from "../schema/movie";

function db() {
  return getDatabase();
}

export function getMovieByFolder(folder: string): Movie | undefined {
  const movie = db().select().from(Movie).where(eq(Movie.folder, folder)).get();
  return movie;
}

export function getAllMovies(): Movie[] {
  const movies = db().select().from(Movie).all();
  return movies;
}

export function saveMovie(input: NewMovie): Movie {
  const result = db().insert(Movie).values(input).returning().get();
  return result;
}

export function updateMovie(id: number, input: Partial<NewMovie>): Movie | undefined {
  const result = db().update(Movie).set(input).where(eq(Movie.id, id)).returning().get();
  return result;
}