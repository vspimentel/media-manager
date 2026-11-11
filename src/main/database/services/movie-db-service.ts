import { getDatabase } from "..";
import { AnyColumn, asc, eq } from "drizzle-orm";
import { Movie, NewMovie } from "../schema/movie";

function db() {
  return getDatabase();
}

/**
 * Retrieves a movie from the database based on the provided field and value.
 * @param {string} field - The field name to search by.
 * @param {string} value - The value to search for in the specified field.
 * @returns {Movie | undefined} The movie if found, otherwise undefined.
 */
export function getMovieByField(field: string, value: string): Movie | undefined {
  const column = (Movie as unknown as Record<string, AnyColumn>)[field];
  if (!column) return undefined;
  const movie = db().select().from(Movie).where(eq(column, value)).get();
  return movie;
}

/**
 * Retrieves all movies from the database, ordered by their folder paths.
 * @returns {Movie[]} An array of all movies in the database.
 */
export function getAllMovies(): Movie[] {
  const movies = db().select().from(Movie).orderBy(asc(Movie.folder)).all();
  return movies;
}

/**
 * Saves a new movie to the database.
 * @param {NewMovie} input - The data for the new movie.
 * @returns {Movie} The saved movie.
 */
export function saveMovie(input: NewMovie): Movie {
  const result = db().insert(Movie).values(input).returning().get();
  return result;
}

/**
 * Updates an existing movie in the database based on the provided ID and input data.
 * @param {number} id - The ID of the movie to update.
 * @param {Partial<NewMovie>} input - The data to update the movie with.
 * @returns {Movie | undefined} The updated movie, or undefined if not found.
 */
export function updateMovie(id: number, input: Partial<NewMovie>): Movie | undefined {
  const result = db().update(Movie).set(input).where(eq(Movie.id, id)).returning().get();
  return result;
}
/**
 * Deletes a movie from the database based on the provided ID.
 * @param {number} id - The ID of the movie to delete.
 */
export function deleteMovie(id: number): void {
  const result = db().delete(Movie).where(eq(Movie.id, id)).run();
  if (result.changes === 0) console.warn(`No movie found with ID ${id} to delete.`);
}