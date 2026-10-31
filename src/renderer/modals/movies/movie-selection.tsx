import PosterFallback from "#components/fallbacks/poster-fallback";
import { DialogContent } from "#components/ui/dialog"
import { InputGroup, InputGroupAddon, InputGroupInput } from "#components/ui/input-group"
import { useChangeMovie } from "#hooks/actions/useChangeMovie";
import { useMovieByTitle } from "#hooks/services/useMoviesByTitle";
import { showToast } from "#lib/utils";
import { CalendarDays, Clapperboard, Globe, Search } from "lucide-react"

const MovieSelectionModal = ({ movieId, title, onClose }: { movieId: number; title: string, onClose: () => void }) => {

    const { data: movies, isLoading, error } = useMovieByTitle(title);
    const changeMovie = useChangeMovie();

    const getReleaseYear = (releaseDate?: string) => {
        if (!releaseDate || releaseDate === "NaN") {
            return "Unknown";
        }

        const date = new Date(releaseDate);

        return Number.isNaN(date.getTime())
            ? "Unknown"
            : date.getFullYear().toString();
    };

    const handleSelectMovie = async (tmbdId: number) => {
        const result = await changeMovie.mutateAsync({ movieId, tmbdId: tmbdId });
        onClose();
        if (result.success) {
            showToast("Action successful", result.message, "success");
        } else {
            showToast("Action failed", result.message, "error");
        }
    }


    return (
        <DialogContent className="w-[min(92vw,640px)] gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-0 text-white shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/10 px-6 pb-5 pt-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    <Clapperboard size={15} /> Movie match
                </div>
                <h2 className="text-xl font-light tracking-tight">Choose the right movie</h2>
                <p className="mt-1.5 text-sm text-white/50">Select a match for <span className="text-white/80">{title}</span></p>
                <InputGroup className="mt-5 rounded-xl border border-white/10 bg-white/4 px-2 h-11 text-sm text-white/40">
                    <InputGroupInput placeholder="Search other movie titles..." />
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
                    <button
                        key={movie.id}
                        type="button"
                        onClick={() => handleSelectMovie(movie.id)}
                        className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.07] bg-white/2.5 p-3 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
                    >
                        <div className="h-19 w-13.5">
                            {movie.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                    className="h-full w-full rounded-lg object-cover border-white/10 bg-gradient-to-"
                                />

                            ) : (
                                <PosterFallback />
                            )}
                        </div>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white/85 transition group-hover:text-white">{movie.title}</span>
                            <span className="mt-1.5 flex items-center gap-1.5 text-xs text-white/40">
                                <CalendarDays size={13} />
                                {getReleaseYear(movie.release_date)}
                                <span className="px-0.5">·</span>
                                <Globe size={13} />
                                {movie.original_language.toUpperCase()}
                            </span>
                            <span className="mt-2 block truncate text-xs text-white/35">{movie.overview}</span>
                        </span>
                        <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white/80">
                            Select
                        </span>
                    </button>
                ))}
            </div>
            <div className="border-t border-white/10 px-6 py-3 text-center text-[11px] text-white/30">Choose a result to update this movie's match</div>
        </DialogContent>
    )
}

export default MovieSelectionModal
