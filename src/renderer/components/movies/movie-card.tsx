import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "#components/ui/context-menu"
import { CalendarDays, Clock3, Globe2, Play, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Movie } from "../../types/movies"
import PosterFallback from "#components/fallbacks/poster-fallback";
import { formatDate, formatDateShort, getCountryName, getYearFromDate, showToast } from "../../utils/common";
import { Link } from "react-router";
import langs from "langs";

const MovieCard = ({ movie, onChangeMovie, onChangePoster, layout }: { movie: Movie; onChangeMovie: (movie: Movie) => void; onChangePoster: (movie: Movie) => void; layout: string }) => {
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

    const { countries, audioTracksAvailable, resolution, subtitlesAvailable } = useMemo(() => {
        const subtitlesAvailable: number = movie.subtitleFiles && movie.subtitleLanguages ? (JSON.parse(movie?.subtitleFiles).length || 0) + (JSON.parse(movie?.subtitleLanguages).length || 0) : 0;
        const audioTracksAvailable: number = movie.audioLanguages ? (JSON.parse(movie?.audioLanguages).length || 0) : 0;
        const resolution: { width: number; height: number; tag: string } = movie.resolution ? JSON.parse(movie.resolution) : { width: 0, height: 0, tag: "Unknown" };
        const countries: string[] = movie?.countries ? JSON.parse(movie.countries).map((country: string) => getCountryName(country)) : [];
        return { countries, audioTracksAvailable, resolution, subtitlesAvailable };
    }, [movie])

    return (
        <>
            <ContextMenu open={openMenu} onOpenChange={setOpenMenu}>
                <ContextMenuTrigger>
                    <div className={`group ${layout === "poster" || layout === "compact" ? "flex flex-col" : ""} ${layout === "compact" ? "gap-2" : layout === "poster" ? "gap-3" : ""}`}>
                        {layout === "poster" || layout === "compact" ? (
                            <>
                                <Link to={`/movies/${movie.id}`} className={`relative aspect-2/3 w-full overflow-hidden border border-white/10 bg-white/4 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25 group-hover:shadow-cyan-950/30 ${layout === "compact" ? "rounded-lg shadow-md" : "rounded-xl shadow-xl shadow-black/30"}`}>
                                    {movie.poster
                                        ? <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
                                        : <PosterFallback iconSize={50} />
                                    }
                                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-white/4 opacity-80" />
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/45 to-transparent" />
                                    <button type="button" aria-label={`Play ${movie.title}`} className={`absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-white/20 text-white opacity-0 shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:scale-95 group-hover:opacity-100 ${layout === "compact" ? "size-10" : "size-14"}`} onClick={handlePlayMovie}>
                                        <Play fill="currentColor" size={layout === "compact" ? 20 : 32} />
                                    </button>
                                </Link>
                                <Link to={`/movies/${movie.id}`} className={`flex min-w-0 flex-col ${layout === "compact" ? "gap-0.5 px-0.5" : "gap-1 px-0.5"}`}>
                                    <div className={`${layout === "compact" ? "text-xs" : "text-sm"} truncate font-medium tracking-tight text-white/90 transition hover:text-cyan-100`}>
                                        {movie.title}
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                        <div className="text-[11px] font-light tracking-wide text-white/40">
                                            {movie.duration}
                                        </div>
                                        <div className="text-[11px] font-light flex items-center tracking-wide text-white/40">
                                            <CalendarDays size={12} className="inline-block mr-1" />
                                            {movie.releaseDate ? getYearFromDate(movie.releaseDate) : "Unknown"}
                                        </div>
                                    </div>
                                </Link>
                            </>
                        ) : layout === "list" ? (
                            <Link to={`/movies/${movie.id}`} className="flex min-h-32 items-center gap-5 rounded-2xl border border-white/8 bg-white/2.5 p-4 transition hover:border-white/15 hover:bg-white/4.5 sm:min-h-36 sm:gap-6 sm:p-5">
                                <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 sm:h-28 sm:w-19">
                                    {movie.poster
                                        ? <img src={movie.poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
                                        : <PosterFallback iconSize={22} />
                                    }
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="block truncate text-base font-medium tracking-tight text-white/90 transition hover:text-cyan-100 sm:text-lg">{movie.title}</div>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/45">
                                        <span className="flex items-center gap-1.5"><Clock3 size={14} />{movie.duration || "Runtime unavailable"}</span>
                                        <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {formatDate(movie.releaseDate)}</span>
                                        <span className="flex items-center gap-1.5"><Star size={14} className="text-white/50" />{movie.voteAverage?.toFixed(1) || "0.0"} / 10</span>
                                        <span className="flex items-center gap-1.5"><Globe2 size={14} />{countries.join(", ") || "Unknown"}</span>
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/35">
                                        {movie.overview || "Synopsis not found for this movie."}
                                    </p>
                                </div>
                                <button type="button" aria-label={`Play ${movie.title}`} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-cyan-100/25 hover:bg-cyan-100/10 hover:text-cyan-50" onClick={handlePlayMovie}>
                                    <Play size={16} fill="currentColor" />
                                </button>
                            </Link>
                        ) : (
                            <Link to={`/movies/${movie.id}`} className="flex flex-col rounded-2xl border border-white/8 bg-white/2.5 p-4 transition hover:border-white/15 hover:bg-white/4.5 sm:p-5">
                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <div className="h-44 w-29 shrink-0 self-center overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:self-start">
                                        {movie.poster
                                            ? <img src={movie.poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
                                            : <PosterFallback iconSize={30} />
                                        }
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-100/45">Movie details</div>
                                                <div className="block text-lg font-medium tracking-tight text-white/90 sm:text-xl">
                                                    {movie.title}
                                                </div>
                                            </div>
                                            <button type="button" aria-label={`Play ${movie.title}`} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-cyan-100/25 hover:bg-cyan-100/10 hover:text-cyan-50" onClick={handlePlayMovie}>
                                                <Play size={16} fill="currentColor" />
                                            </button>
                                        </div>
                                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/40">{movie.overview || "Synopsis not found for this movie."}</p>
                                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                                            {[
                                                ["Runtime", movie.duration || "—"],
                                                ["Release date", formatDateShort(movie.releaseDate)],
                                                ["Rating", `${movie.voteAverage?.toFixed(1)}/10.0` || "0.0/10.0"],
                                                ["Countries", countries.join(", ") || "Unknown"],
                                                ["Language", movie?.originalLanguage && langs.where("1", movie.originalLanguage)?.name || "Unknown"],
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
                                        ["Subtitles", subtitlesAvailable > 0 ? `${subtitlesAvailable} ${subtitlesAvailable === 1 ? "subtitle" : "subtitles"} available` : "No subtitles available"],
                                        ["Audio language", audioTracksAvailable > 0 ? `${audioTracksAvailable} ${audioTracksAvailable === 1 ? "audio track" : "audio tracks"} available` : "No audio tracks available"],
                                        ["Video quality", `${resolution.tag} (${resolution.width}x${resolution.height})` || "Unknown"],
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
