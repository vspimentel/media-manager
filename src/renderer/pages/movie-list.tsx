import MovieCard from "#components/movies/movie-card";
import { Dialog } from "#components/ui/dialog";
import { Button } from "#components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "#components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#components/ui/select";
import { useEffect, useRef, useState } from "react";
import { Film, Search, SlidersHorizontal, Sparkles, Tv, Gamepad2, Images, Settings, RefreshCw, ArrowDownWideNarrow, ArrowUpWideNarrow, LayoutGrid, Grid2X2, List, AlignJustify } from "lucide-react";
import { showToast } from "../utils/common";
import { Movie } from "../types/movies";
import MovieSelectionModal from "../modals/movies/movie-selection";
import MoviePosterSelectionModal from "../modals/movies/poster-selection";
import { useGetMovies } from "#hooks/services/useGetMovies";

const MOVIE_LIST_PREFERENCES_KEY = "movie-library-preferences";
const MOVIE_LIST_SCROLL_KEY = "movie-library-scroll";
const validLayouts = ["poster", "compact", "list", "details"];
const validSortFields = ["folder", "title", "releaseDate", "voteAverage"];

function readMovieListPreferences() {
    try {
        const saved = JSON.parse(localStorage.getItem(MOVIE_LIST_PREFERENCES_KEY) ?? "null");
        return {
            layout: validLayouts.includes(saved?.layout) ? saved.layout : "poster",
            sortBy: validSortFields.includes(saved?.sortBy) ? saved.sortBy : "folder",
            sortDirection: saved?.sortDirection === "desc" ? "desc" : "asc",
        };
    } catch {
        return { layout: "poster", sortBy: "folder", sortDirection: "asc" };
    }
}

const MovieListPage = () => {
    const [preferences] = useState(readMovieListPreferences);
    const [layout, setLayout] = useState<string>(preferences.layout);

    const layoutOptions: SelectItem[] = [
        { value: "poster", label: { text: "Poster grid", "icon": <LayoutGrid size={13} className="text-cyan-100/55" /> } },
        { value: "compact", label: { text: "Compact grid", "icon": <Grid2X2 size={13} className="text-cyan-100/55" /> } },
        { value: "list", label: { text: "List", "icon": <List size={13} className="text-cyan-100/55" /> } },
        { value: "details", label: { text: "Details", "icon": <AlignJustify size={13} className="text-cyan-100/55" /> } }
    ]

    const handleLayoutChange = (value: string) => {
        setLayout(value);
    }

    const [sortBy, setSortBy] = useState<string>(preferences.sortBy);
    const [sortDirection, setSortDirection] = useState<string>(preferences.sortDirection);

    useEffect(() => {
        localStorage.setItem(MOVIE_LIST_PREFERENCES_KEY, JSON.stringify({ layout, sortBy, sortDirection }));
    }, [layout, sortBy, sortDirection]);

    const sortOptions: SelectItem[] = [
        { value: "folder", label: "Folder name" },
        { value: "title", label: "Title" },
        { value: "releaseDate", label: "Release date" },
        { value: "voteAverage", label: "Rating" }
    ]

    const handleSortChange = (value: string) => {
        setSortBy(value);
    }

    const handleSortDirectionChange = () => {
        setSortDirection((value) => value === "asc" ? "desc" : "asc");
    }

    const { data: movies, update, isLoading, isRefetching, error } = useGetMovies(sortBy, sortDirection);

    const [movieForChange, setMovieForChange] = useState<Movie | null>(null);

    const [movieForPosterChange, setMovieForPosterChange] = useState<Movie | null>(null);

    const handleUpdateList = () => {
        update();
        if (!error) showToast({
            title: "Movie library updated",
            message: "Your movie library has been successfully updated.",
            type: "success"
        });
    }

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoading && scrollRef.current) {
            scrollRef.current.scrollTop = Number(
                localStorage.getItem(MOVIE_LIST_SCROLL_KEY) ?? 0
            );
        }
    }, [isLoading]);

    return (
        <div className="mx-auto flex h-screen w-full max-w-[1800px] gap-6 p-5 text-white md:p-7">
            <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-white/8 bg-black/25 p-4 shadow-2xl backdrop-blur-xl lg:flex">
                <div className="mb-9 flex items-center gap-3 px-2 pt-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100"><Film size={18} /></div>
                    <div><div className="text-sm font-medium tracking-wide">FRAME</div><div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Movie library</div></div>
                </div>
                <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Your library</div>
                <div className="flex justify-between flex-col h-full">
                    <nav aria-label="Library sections" className="space-y-1">
                        <Button type="button" aria-current="page" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 hover:text-white"><Film size={16} className="text-cyan-100/80" /> Movies <span className="ml-auto text-xs text-white/40">{movies?.length ?? "—"}</span></Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/5 hover:text-white/80"><Tv size={16} className="text-white/40" /> TV shows</Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/5 hover:text-white/80"><Sparkles size={16} className="text-white/40" />Anime</Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/5 hover:text-white/80"><Gamepad2 size={16} className="text-white/40" />Games</Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/5 hover:text-white/80"><Images size={16} className="text-white/40" />Galleries</Button>
                    </nav>
                    <Button type="button" variant="ghost" className="mt-3 h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/5 hover:text-white/85"><Settings size={16} className="text-white/45" />Settings</Button>
                </div>
            </aside>
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/8 bg-black/15 shadow-2xl backdrop-blur-md">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 px-5 py-5 md:px-7 md:py-6">
                    <div><div className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-100/55">Your collection</div><h1 className="text-2xl font-light tracking-tight md:text-3xl">All movies</h1><p className="mt-1.5 text-xs text-white/40">A little something for every night.</p></div>
                    <div className="flex items-center gap-2">
                        <InputGroup className="hidden h-10 w-64 rounded-xl border-white/10 bg-white/4 shadow-none focus-within:border-white/20 focus-within:ring-0 sm:flex">
                            <InputGroupAddon align="inline-start" className="pl-3 text-white/40">
                                <InputGroupText><Search size={15} /></InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput aria-label="Search your library" placeholder="Search your library" className="h-full min-w-0 px-0 text-sm text-white placeholder:text-white/35" />
                        </InputGroup>
                        <Button type="button" variant="ghost" size="icon" aria-label="Filter movies" className="h-10 w-10 rounded-xl border border-white/10 bg-white/4 text-white/50 hover:bg-white/8 hover:text-white">
                            <SlidersHorizontal size={16} />
                        </Button>
                        <Button
                            type="button" variant="ghost" size="icon"
                            aria-label="Update movie library"
                            className="h-10 w-10 rounded-xl border border-white/10 bg-white/4 text-white/50 hover:bg-white/8 hover:text-white"
                            onClick={handleUpdateList}
                            disabled={isRefetching}
                        >
                            <RefreshCw size={15} className={isRefetching ? "animate-spin" : ""} />
                        </Button>
                    </div>
                </header>
                <div
                    ref={scrollRef}
                    onScroll={(event) => {
                        localStorage.setItem(
                            MOVIE_LIST_SCROLL_KEY,
                            String(event.currentTarget.scrollTop)
                        )
                    }}
                    className="soft-scrollbar flex-1 overflow-y-auto p-5 pt-4 md:p-7 md:pt-6"
                >
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-white/45">
                            <span className="rounded-md border border-white/8 bg-white/5 px-2 py-1 font-medium tabular-nums text-white/75">{movies?.length ?? "—"}</span>
                            <span>titles in your library</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={layout} items={layoutOptions} onValueChange={(value) => handleLayoutChange(String(value))}>
                                <SelectTrigger size="sm" className="h-9 w-40 rounded-lg border-white/8 bg-white/4 px-3 text-xs text-white/75 shadow-none hover:border-white/15 hover:bg-white/8 dark:bg-white/4">
                                    <SelectValue>
                                        {layoutOptions.find((option) => option.value === layout)?.label.icon}
                                        {layoutOptions.find((option) => option.value === layout)?.label.text}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="w-40 min-w-40 border-white/10 bg-zinc-950 text-white">
                                    {layoutOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className="flex items-center gap-2 text-white/75">
                                            {option.label.icon}
                                            {option.label.text}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select items={sortOptions} value={sortBy} onValueChange={(value) => handleSortChange(String(value))}>
                                <SelectTrigger className="h-8 w-36 rounded-lg border-white/8 bg-white/4 px-3 text-xs text-white/75 shadow-none hover:border-white/15 hover:bg-white/8 dark:bg-white/4">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="w-36 min-w-36 border-white/10 bg-zinc-950 text-white">
                                    {sortOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className="text-white/75">{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleSortDirectionChange()}
                                className="border-white/8 bg-white/4 px-3 text-xs text-white/75 shadow-none hover:border-white/15 hover:bg-white/8 dark:bg-white/4 hover:text-white"
                            >
                                {sortDirection === "desc"
                                    ? <ArrowDownWideNarrow size={14} />
                                    : <ArrowUpWideNarrow size={14} />
                                }
                            </Button>

                        </div>
                    </div>
                    <div className={layout === "poster" ? "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:gap-x-5 md:gap-y-8 xl:grid-cols-4 2xl:grid-cols-5" : layout === "compact" ? "grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:gap-x-4 md:gap-y-6 xl:grid-cols-5 2xl:grid-cols-6" : "flex flex-col gap-3"}>
                        {movies?.map((movie) => (
                            <MovieCard
                                key={movie.title}
                                movie={movie}
                                onChangeMovie={setMovieForChange}
                                onChangePoster={setMovieForPosterChange}
                                layout={layout}
                            />
                        ))}
                        {isLoading &&
                            Array.from({ length: layout === "poster" || layout === "compact" ? 10 : 8 }, (_, index) => layout === "poster" || layout === "compact" ?
                                <div key={index} className="animate-pulse">
                                    <div className="aspect-2/3 rounded-xl border border-white/6 bg-white/4.5" />
                                    <div className="mt-3 h-3 w-3/4 rounded bg-white/[0.07]" />
                                    <div className="mt-2 h-2.5 w-1/2 rounded bg-white/5" />
                                </div>
                                : <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/6 bg-white/4.5" />
                            )}
                        {error && <div className="col-span-full rounded-xl border border-white/10 bg-white/4 p-6 text-sm text-white/50">Your movie collection could not be loaded.</div>}
                    </div>
                </div>
            </main>
            <Dialog
                open={movieForChange !== null}
                onOpenChange={(open) => { if (!open) setMovieForChange(null); }}
            >
                {movieForChange && (
                    <MovieSelectionModal
                        movie={movieForChange}
                        onClose={() => setMovieForChange(null)}
                    />
                )}
            </Dialog>
            <Dialog
                open={movieForPosterChange !== null}
                onOpenChange={(open) => { if (!open) setMovieForPosterChange(null); }}
            >
                {movieForPosterChange && (
                    <MoviePosterSelectionModal
                        movie={movieForPosterChange}
                        onClose={() => setMovieForPosterChange(null)}
                    />
                )}
            </Dialog>
        </div>
    )
}

export default MovieListPage;
