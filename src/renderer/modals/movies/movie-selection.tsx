import PosterFallback from "#components/fallbacks/poster-fallback";
import { DialogContent } from "#components/ui/dialog"
import { Button } from "#components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "#components/ui/input-group"
import { useChangeMovie } from "#hooks/actions/useChangeMovie";
import { useSearchMovies } from "#hooks/services/useSearchMovies";
import { showToast } from "../../utils/common";
import { CalendarDays, Clapperboard, Globe, Search } from "lucide-react"
import { Movie } from "../../types/movies";
import { useState } from "react";
import useDebounce from "#hooks/common/useDebounce";

const MovieSelectionModal = ({ movie, onClose }: { movie: Movie; onClose: () => void }) => {

    const [query, setQuery] = useState(movie.folder);

    const debouncedQuery = useDebounce(query, 500);

    const { data: movies, isLoading, error } = useSearchMovies(debouncedQuery);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const getReleaseYear = (releaseDate?: string) => {
        if (!releaseDate || releaseDate === "NaN") {
            return "Unknown";
        }

        const date = new Date(releaseDate);

        return Number.isNaN(date.getTime())
            ? "Unknown"
            : date.getFullYear().toString();
    };

    const changeMovie = useChangeMovie();

    const handleSelectMovie = async (tmdbId: number) => {
        try {
            const result = await changeMovie.mutateAsync({ movieId: movie.id, tmdbId });

            showToast({
                title: "Action successful",
                message: result.message,
                type: "success",
            });

            onClose();
        } catch (error) {
            showToast({
                title: "Action failed",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    };


    return (
        <DialogContent className="w-[min(92vw,640px)] gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-0 text-white shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/10 px-6 pb-5 pt-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    <Clapperboard size={15} /> Movie match
                </div>
                <h2 className="text-xl font-light tracking-tight">Choose the right movie</h2>
                <p className="mt-1.5 text-sm text-white/50">Select a match for <span className="text-white/80">{movie.title}</span></p>
                <InputGroup className="mt-5 rounded-xl border border-white/10 bg-white/4 px-2 h-11 text-sm text-white/40">
                    <InputGroupInput
                        placeholder="Search other movie titles..."
                        onChange={handleChange}
                        value={query}
                    />
                    <InputGroupAddon>
                        <Search size={16} />
                    </InputGroupAddon>
                    <InputGroupAddon align={"inline-end"}>
                        <span className="ml-auto rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] tracking-wide text-white/30">TMDB</span>
                    </InputGroupAddon>
                </InputGroup>
            </div>

            <div className="soft-scrollbar max-h-[min(58vh,440px)] space-y-2 overflow-y-auto p-4">
                {movies && movies.map((movie) => (
                    <div
                        key={movie.id}
                        className="flex w-full items-center gap-4 rounded-xl border border-white/[0.07] bg-white/2.5 p-3"
                    >
                        <div className="*:aspect-2/3 w-15 shrink-0 overflow-hidden rounded-lg bg-white/5">
                            {movie.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                    alt={movie.title}
                                    className="h-full w-full rounded-lg object-cover border-white/10 bg-gradient-to-"
                                />

                            ) : (
                                <PosterFallback />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-white/85 transition group-hover:text-white">{movie.title}</div>
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/40">
                                <CalendarDays size={13} />
                                {getReleaseYear(movie.release_date)}
                                <span className="px-0.5">·</span>
                                <Globe size={13} />
                                {movie.original_language.toUpperCase()}
                            </div>
                            <div className="mt-2 line-clamp-2 overflow-hidden text-xs text-white/35">{movie.overview}</div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-white/20 hover:bg-white/10 hover:text-white/80"
                            onClick={() => handleSelectMovie(movie.id)}
                        >
                            Select
                        </Button>
                    </div>
                ))}
            </div>
            <div className="border-t border-white/10 px-6 py-3 text-center text-[11px] text-white/30">Choose a result to update this movie's match</div>
        </DialogContent>
    )
}

export default MovieSelectionModal
