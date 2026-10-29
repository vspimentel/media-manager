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

const MovieCard = ({ movie, onChangeMovie }: { movie: Movie; onChangeMovie: (movie: Movie) => void }) => {
    const [openMenu, setOpenMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setOpenMenu(false);
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, []);

    const handleOpenMovieFolder = async () => await window.electron.openMovieFolder(movie.folder);

    return (
        <>
            <ContextMenu open={openMenu} onOpenChange={setOpenMenu}>
                <ContextMenuTrigger>
                    <div className="group flex flex-col gap-3">
                        <div className="relative aspect-2/3 w-full overflow-hidden rounded-xl border border-white/10 bg-white/4 shadow-xl shadow-black/30 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25 group-hover:shadow-cyan-950/30">
                            {movie.poster ? (
                                <img
                                    src={movie.poster}
                                    alt={movie.title}
                                    className="h-full w-full object-cover "
                                />) : (
                                <PosterFallback iconSize={50} />
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-white/4 opacity-80" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/45 to-transparent" />
                            <div className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-white/20 text-white opacity-0 shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:scale-95 group-hover:opacity-100">
                                <Play fill="currentColor" size={32} />
                            </div>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1 px-0.5">
                            <div className="truncate text-sm font-medium tracking-tight text-white/90">{movie.title}</div>
                            <div className="text-[11px] font-light tracking-wide text-white/40">{movie.duration}</div>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="min-w-48 rounded-xl border-white/10 bg-black/70 p-1 text-white shadow-2xl backdrop-blur-xl">
                    <ContextMenuItem
                        className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white"
                        onClick={handleOpenMovieFolder}
                    >
                        Open folder
                    </ContextMenuItem>
                    <ContextMenuItem className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white">
                        Open subtitles
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
                    <ContextMenuItem className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white">
                        Change movie poster
                    </ContextMenuItem>
                    <ContextMenuSeparator className="bg-white/10" />
                    <ContextMenuItem className="rounded-lg px-2 py-1 text-sm font-light text-red-400 data-highlighted:bg-red-500/15 data-highlighted:text-red-300">
                        Hide movie
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>
    )
}

export default MovieCard
