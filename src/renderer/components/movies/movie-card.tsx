import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "#components/ui/context-menu"
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Movie } from "../../types/movies"
import PosterFallback from "#components/fallbacks/poster-fallback";
import { showToast } from "../../utils/common";
import { Link } from "react-router";

type MovieLayout = "poster" | "compact" | "list" | "details";

const MovieCard = ({ movie, onChangeMovie, onChangePoster, layout = "poster" }: { movie: Movie; onChangeMovie: (movie: Movie) => void; onChangePoster: (movie: Movie) => void; layout?: MovieLayout }) => {
    const [openMenu, setOpenMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setOpenMenu(false);
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, []);

    const handleOpenMovieFolder = async () => {
        const result = await window.electron.openMovieFolder(movie.folder)
        if (!result.success) showToast({
            title: "Error opening movie folder",
            message: result.message,
            type: "error",
        });
    }

    const handlePlayMovie = async () => {
        const result = await window.electron.playMovie(movie.folder, movie.videoFile, movie.selectedSubtitleLanguage, movie.selectedAudioLanguage)
        if (!result.success) showToast({
            title: "Error playing movie",
            message: result.message,
            type: "error",
        });
    }

    //TODO: Add support for multiple subtitle files and allow user to select which one to open
    const handleOpenSubtitlesFile = async (subtitlesFile: string) => {
        const result = await window.electron.openSubtitlesFile(movie.folder, subtitlesFile)
        if (!result.success) showToast({
            title: "Error opening subtitles file",
            message: result.message,
            type: "error",
        });
    }

    return (
        <>
            <ContextMenu open={openMenu} onOpenChange={setOpenMenu}>
                <ContextMenuTrigger>
                    <div className={`group ${layout === "poster" || layout === "compact" ? "flex flex-col" : ""} ${layout === "compact" ? "gap-2" : layout === "poster" ? "gap-3" : ""}`}>
                        {layout === "poster" || layout === "compact" ? (
                            <>
                                <Link to={`/movies/${movie.id}`} className={`relative aspect-2/3 w-full overflow-hidden border border-white/10 bg-white/4 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25 group-hover:shadow-cyan-950/30 ${layout === "compact" ? "rounded-lg shadow-md" : "rounded-xl shadow-xl shadow-black/30"}`}>
                                    {movie.poster ? <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" /> : <PosterFallback iconSize={50} />}
                                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-white/4 opacity-80" />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/45 to-transparent" />
                                    <button type="button" aria-label={`Play ${movie.title}`} className={`absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-white/20 text-white opacity-0 shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:scale-95 group-hover:opacity-100 ${layout === "compact" ? "size-10" : "size-14"}`} onClick={handlePlayMovie}>
                                        <Play fill="currentColor" size={layout === "compact" ? 20 : 32} />
                                    </button>
                                </Link>
                                <Link to={`/movies/${movie.id}`} className={`flex min-w-0 flex-col ${layout === "compact" ? "gap-0.5 px-0.5" : "gap-1 px-0.5"}`}>
                                    <div className={`${layout === "compact" ? "text-xs" : "text-sm"} truncate font-medium tracking-tight text-white/90 transition hover:text-cyan-100`}>{movie.title}</div>
                                    <div className="text-[11px] font-light tracking-wide text-white/40">{movie.duration}</div>
                                </Link>
                            </>
                        ) : layout === "list" ? (
                            <Link to={`/movies/${movie.id}`} className="flex min-h-32 items-center gap-5 rounded-2xl border border-white/8 bg-white/2.5 p-4 transition hover:border-white/15 hover:bg-white/4.5 sm:min-h-36 sm:gap-6 sm:p-5">
                                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 sm:h-28 sm:w-19">
                                    {movie.poster ? <img src={movie.poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" /> : <PosterFallback iconSize={22} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="block truncate text-base font-medium tracking-tight text-white/90 transition hover:text-cyan-100 sm:text-lg">{movie.title}</div>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/45">
                                        <span>{movie.duration || "Runtime —"}</span>
                                        <span>{movie.subtitleFiles ? "Subtitles available" : "No subtitles"}</span>
                                        <span>Release year —</span>
                                        <span>Rating —</span>
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/35">Synopsis not added yet</p>
                                </div>
                                <button type="button" aria-label={`Play ${movie.title}`} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-cyan-100/25 hover:bg-cyan-100/10 hover:text-cyan-50" onClick={handlePlayMovie}>
                                    <Play size={16} fill="currentColor" />
                                </button>
                            </Link>
                        ) : (
                            <Link to={`/movies/${movie.id}`} className="rounded-2xl border border-white/8 bg-white/2.5 p-4 transition hover:border-white/15 hover:bg-white/4.5 sm:p-5">
                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <div className="h-44 w-29 shrink-0 self-center overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:self-start">
                                        {movie.poster ? <img src={movie.poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" /> : <PosterFallback iconSize={30} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-100/45">Movie details</div>
                                                <Link to={`/movies/${movie.id}`} className="block text-lg font-medium tracking-tight text-white/90 transition hover:text-cyan-100 sm:text-xl">{movie.title}</Link>
                                            </div>
                                            <button type="button" aria-label={`Play ${movie.title}`} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-cyan-100/25 hover:bg-cyan-100/10 hover:text-cyan-50" onClick={handlePlayMovie}>
                                                <Play size={16} fill="currentColor" />
                                            </button>
                                        </div>
                                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/40">Synopsis not added yet. Add a description to see a summary of this movie here.</p>
                                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                                            {[
                                                ["Runtime", movie.duration || "—"],
                                                ["Release year", "—"],
                                                ["Rating", "—"],
                                                ["Genre", "—"],
                                                ["Director", "—"],
                                            ].map(([label, value]) => (
                                                <div key={label} className="rounded-xl border border-white/6 bg-black/15 px-3 py-2.5">
                                                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">{label}</div>
                                                    <div className="mt-1 truncate text-xs text-white/70">{value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/6 pt-4">
                                    {[
                                        ["Subtitles", movie.subtitleFiles ? "Available" : "None"],
                                        ["Audio language", "—"],
                                        ["Video quality", "—"],
                                    ].map(([label, value]) => (
                                        <div key={label} className="min-w-0">
                                            <div className="text-[10px] uppercase tracking-[0.12em] text-white/30">{label}</div>
                                            <div className="mt-1 truncate text-xs text-white/65">{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </Link>
                        )}
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="min-w-48 rounded-xl border-white/10 bg-black/70 p-1 text-white shadow-2xl backdrop-blur-xl">
                    <ContextMenuItem
                        className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white"
                        onClick={handleOpenMovieFolder}
                    >
                        Open folder
                    </ContextMenuItem>
                    {movie.subtitleFiles && (
                        <ContextMenuItem className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white" onClick={() => handleOpenSubtitlesFile(movie.subtitleFiles![0])}>
                            Open subtitles
                        </ContextMenuItem>
                    )}
                    <ContextMenuSeparator className="bg-white/10" />
                    <ContextMenuItem
                        className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white"
                        onClick={() => {
                            setOpenMenu(false);
                            onChangeMovie(movie);
                        }}
                    >
                        Change movie
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white"
                        onClick={() => {
                            setOpenMenu(false);
                            onChangePoster(movie);
                        }}
                    >
                        Change movie poster
                    </ContextMenuItem>
                    <ContextMenuSeparator className="bg-white/10" />
                    <ContextMenuItem className="rounded-lg px-2 py-1 text-sm font-light text-red-400 data-highlighted:bg-red-500/15 data-highlighted:text-red-300">
                        Remove movie entry
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>
    )
}

export default MovieCard
