import MovieCard from "#components/movies/movie-card";
import { Dialog } from "#components/ui/dialog";
import { Button } from "#components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "#components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#components/ui/select";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Film, Search, SlidersHorizontal, Sparkles, Tv, Gamepad2, Images, Settings, RefreshCw, ArrowDownWideNarrow, ArrowUpWideNarrow, LayoutGrid, Grid2X2, List, AlignJustify, Clapperboard, History, RotateCcw } from "lucide-react";
import MovieSelectionModal from "#components/modals/movies/movie-selection";
import MoviePosterSelectionModal from "#components/modals/movies/poster-selection";
import { useGetMovies } from "#hooks/services/movies/useGetMovies";
import { getCountryName, getLanguageName, showToast } from "#utils/common";
import { Movie, MovieFilters } from "#types/movies";
import { usePageContext } from "#hooks/common/usePageContext";
import { Popover, PopoverContent, PopoverTrigger, PopoverTitle } from "#components/ui/popover";
import { Input } from "#components/ui/input";
import { Slider } from "#components/ui/slider";
import { MovieResolution } from "../../main/types/movies";
import SliderInput from "#components/ui/slider-input";

const MovieListPage = () => {
    const MOVIE_LIST_PREFERENCES_KEY = "movie-library-preferences";

    const layoutOptions: SelectItem[] = [
        { value: "poster", label: { text: "Poster grid", "icon": <LayoutGrid size={13} className="text-cyan-100/55" /> } },
        { value: "compact", label: { text: "Compact grid", "icon": <Grid2X2 size={13} className="text-cyan-100/55" /> } },
        { value: "list", label: { text: "List", "icon": <List size={13} className="text-cyan-100/55" /> } },
        { value: "details", label: { text: "Details", "icon": <AlignJustify size={13} className="text-cyan-100/55" /> } }
    ]

    const sortOptions: SelectItem[] = [
        { value: "folder", label: "Folder name" },
        { value: "title", label: "Title" },
        { value: "releaseDate", label: "Release date" },
        { value: "voteAverage", label: "Rating" }
    ]

    const readMovieListPreferences = useCallback(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(MOVIE_LIST_PREFERENCES_KEY) ?? "null");
            return {
                layout: saved.layout || "poster",
                sortBy: saved.sortBy || "folder",
                sortDirection: saved.sortDirection || "asc",
            };
        } catch {
            return { layout: "poster", sortBy: "folder", sortDirection: "asc" };
        }
    }, [MOVIE_LIST_PREFERENCES_KEY]);

    const preferences = readMovieListPreferences();

    const [layout, setLayout] = useState<string>(preferences.layout);
    const [sortBy, setSortBy] = useState<string>(preferences.sortBy);
    const [sortDirection, setSortDirection] = useState<string>(preferences.sortDirection);

    const handleLayoutChange = (value: string) => {
        setLayout(value);
    }

    const handleSortChange = (value: string) => {
        setSortBy(value);
    }

    const handleSortDirectionChange = () => {
        setSortDirection((value) => value === "asc" ? "desc" : "asc");
    }

    useEffect(() => {
        localStorage.setItem(
            MOVIE_LIST_PREFERENCES_KEY,
            JSON.stringify({
                layout,
                sortBy,
                sortDirection
            }));
    }, [layout, sortBy, sortDirection]);

    const { data: movies, update, isLoading, isRefetching, error } = useGetMovies(sortBy, sortDirection);

    const MOVIE_LIST_SCROLL_KEY = "movie-library-scroll";

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoading && scrollRef.current) {
            scrollRef.current.scrollTop = Number(
                localStorage.getItem(MOVIE_LIST_SCROLL_KEY) ?? 0
            );
        }
    }, [isLoading, scrollRef.current]);

    const { languageItems, countryItems, resolutionItems } = useMemo(() => {
        if (!movies) return { countryOptions: [], languageOptions: [] };

        const countriesSet = new Set<string>();
        const languagesSet = new Set<string>();

        movies.map((movie) => {
            const countries = JSON.parse(movie.countries ?? "[]") as string[];
            countries.forEach((country) => countriesSet.add(country));
        })

        movies.map((movie) => {
            movie.originalLanguage && languagesSet.add(movie.originalLanguage);
        })

        const countryOptions = [...countriesSet]
        const languageOptions = [...languagesSet]

        const countryItems = countryOptions.map((country) => ({ value: country, label: getCountryName(country) }))
            .sort((a, b) => (a.label || "").localeCompare(b.label || ""));

        const languageItems = languageOptions.map((language) => ({ value: language, label: getLanguageName(language) }))
            .sort((a, b) => (a.label || "").localeCompare(b.label || ""));

        const resolutionItems = [
            { value: "4K", label: "4K" },
            { value: "2K", label: "2K" },
            { value: "1080p", label: "1080p" },
            { value: "720p", label: "720p" },
            { value: "480p", label: "480p" }
        ]

        return { languageItems, countryItems, resolutionItems };
    }, [movies]);

    const [filters, setFilters] = useState<MovieFilters>({
        query: "",
        yearRange: [1900, 2100],
        country: "",
        language: "",
        resolution: ""
    });

    const [activeFilterCount, setActiveFilterCount] = useState<number>(0);

    const filteredMovies = useMemo(() => {
        if (!movies) return [];
        let filtered = movies;
        let activeFilters = 0;

        if (filters.query) {
            activeFilters++;
            const query = filters.query.toLowerCase();
            filtered = filtered.filter((movie) => {
                const title = movie.title?.toLowerCase() ?? "";
                const originalTitle = movie.originalTitle?.toLowerCase() ?? "";
                const overview = movie.overview?.toLowerCase() ?? "";
                return title.includes(query) || originalTitle.includes(query) || overview.includes(query);
            });
        }

        if (filters.yearRange[0] !== 1900 || filters.yearRange[1] !== 2100) {
            activeFilters++;
            const [startYear, endYear] = filters.yearRange;
            filtered = filtered.filter((movie) => {
                const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
                return releaseYear !== null && releaseYear >= startYear && releaseYear <= endYear;
            });
        }

        if (filters.country) {
            activeFilters++;
            filtered = filtered.filter((movie) => {
                const countries = JSON.parse(movie.countries ?? "[]") as string[];
                return countries.includes(filters.country);
            });
        }

        if (filters.language) {
            activeFilters++;
            filtered = filtered.filter((movie) => movie.originalLanguage === filters.language);
        }

        if (filters.resolution) {
            activeFilters++;
            filtered = filtered.filter((movie) => {
                const resolutions = JSON.parse(movie.resolution ?? "{}") as MovieResolution;
                return resolutions.tag === filters.resolution;
            });
        }

        setActiveFilterCount(activeFilters);

        return filtered;
    }, [movies, filters]);

    const clearFilters = () => {
        setFilters({
            query: "",
            yearRange: [1900, 2100],
            country: "",
            language: "",
            resolution: ""
        });
    }

    const handleUpdateList = () => {
        update();
        if (!error) showToast({
            title: "Movie library updated",
            message: "Your movie library has been successfully updated.",
            type: "success"
        });
    }

    const [movieForChange, setMovieForChange] = useState<Movie | null>(null);
    const [movieForPosterChange, setMovieForPosterChange] = useState<Movie | null>(null);

    const { setShowMovieSettingsModal } = usePageContext();

    const handleOpenSettings = () => {
        setShowMovieSettingsModal(true);
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-[1800px] gap-6 p-5 text-white md:p-7">
            <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-white/8 bg-black/25 p-4 shadow-2xl backdrop-blur-xl lg:flex">
                <div className="mb-9 flex items-center gap-3 px-2 pt-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
                        <Film size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-medium tracking-wide">FRAME</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Media manager</div>
                    </div>
                </div>
                <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Your library</div>
                <div className="flex justify-between flex-col h-full">
                    <nav className="space-y-1">
                        <Button type="button" aria-current="page" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 hover:text-white">
                            <Clapperboard size={16} className="text-cyan-100/80" /> Movies <span className="ml-auto text-xs text-white/40">{movies?.length ?? "—"}</span>
                        </Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/10 hover:text-white">
                            <Tv size={16} className="text-white/40" /> TV shows
                        </Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/10 hover:text-white">
                            <Sparkles size={16} className="text-white/40" />Anime
                        </Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/10 hover:text-white">
                            <Gamepad2 size={16} className="text-white/40" />Games
                        </Button>
                        <Button type="button" variant="ghost" className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/10 hover:text-white">
                            <Images size={16} className="text-white/40" />Galleries
                        </Button>
                    </nav>
                    <nav className="space-y-1">
                        <Button type="button" variant="ghost" className="mt-3 h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/10 hover:text-white">
                            <History size={16} className="text-white/45" />History
                        </Button>
                        <Button type="button" variant="ghost" onClick={handleOpenSettings} className="mt-1 h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 hover:bg-white/10 hover:text-white">
                            <Settings size={16} className="text-white/45" />Settings
                        </Button>
                    </nav>
                </div>
            </aside>
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/8 bg-black/15 shadow-2xl backdrop-blur-md">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 px-5 py-5 md:px-7 md:py-6">
                    <div>
                        <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-100/55">Your collection</div>
                        <h1 className="text-2xl font-light tracking-tight md:text-3xl">All movies</h1>
                        <p className="mt-1.5 text-xs text-white/40">Detailed information about your movie library</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <InputGroup className="flex h-10 w-36 rounded-xl border-white/10 bg-white/4 shadow-none focus-within:border-white/20 focus-within:ring-0 sm:w-64">
                            <InputGroupAddon align="inline-start" className="pl-3 text-white/40">
                                <InputGroupText>
                                    <Search size={15} />
                                </InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder="Search your library"
                                value={filters.query}
                                onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                                className="h-full min-w-0 px-0 text-sm text-white placeholder:text-white/35"
                            />
                        </InputGroup>
                        <Popover>
                            <PopoverTrigger
                                render={<Button
                                    type="button" variant="ghost" size="icon"
                                    className="relative h-10 w-10 rounded-xl border border-white/10 bg-white/4 text-white/50 hover:bg-white/10 hover:text-white"
                                />}
                            >
                                <SlidersHorizontal size={16} />
                                {activeFilterCount > 0 &&
                                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-cyan-100 text-[9px] font-semibold text-zinc-900">
                                        {activeFilterCount}
                                    </span>
                                }
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[min(92vw,360px)] gap-3 rounded-xl border border-white/10 bg-zinc-950 p-4 text-white shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <PopoverTitle className="text-sm text-white/90">
                                        Filter movies
                                    </PopoverTitle>
                                    <Button
                                        type="button" variant="ghost" size="xs"
                                        onClick={clearFilters} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-white/20 hover:bg-white/10 hover:text-white"
                                    >
                                        <RotateCcw size={12} /> Clear
                                    </Button>
                                </div>
                                <SliderInput
                                    value={filters.yearRange}
                                    min={1900}
                                    max={2030}
                                    onCommit={(value) => setFilters({ ...filters, yearRange: value })}
                                />
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-white/55">
                                        Country
                                    </div>
                                    <Select value={filters.country} items={countryItems} onValueChange={(value) => setFilters({ ...filters, country: (value || "") })}>
                                        <SelectTrigger className="h-9 w-full border-white/10 bg-white/4 text-sm text-white/80">
                                            <SelectValue placeholder="Select a country..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(countryItems || []).map((item) =>
                                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-white/55">
                                        Language
                                    </div>
                                    <Select value={filters.language} items={languageItems} onValueChange={(value) => setFilters({ ...filters, language: (value || "") })}>
                                        <SelectTrigger className="h-9 w-full border-white/10 bg-white/4 text-sm text-white/80">
                                            <SelectValue placeholder="Select a language..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(languageItems || []).map((item) =>
                                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-white/55">
                                        Resolution
                                    </div>
                                    <Select value={filters.resolution} items={resolutionItems} onValueChange={(value) => setFilters({ ...filters, resolution: (value || "") })}>
                                        <SelectTrigger className="h-9 w-full border-white/10 bg-white/4 text-sm text-white/80">
                                            <SelectValue placeholder="Select a resolution..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(resolutionItems || []).map((item) =>
                                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            type="button" variant="ghost" size="icon"
                            aria-label="Update movie library"
                            className="h-10 w-10 rounded-xl border border-white/10 bg-white/4 text-white/50 hover:bg-white/10 hover:text-white"
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
                        localStorage.setItem(MOVIE_LIST_SCROLL_KEY, String(event.currentTarget.scrollTop))
                    }}
                    className="soft-scrollbar flex-1 overflow-y-auto p-5 pt-4 md:p-7 md:pt-6"
                >
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-white/45">
                            <span className="rounded-md border border-white/8 bg-white/5 px-2 py-1 font-medium tabular-nums text-white/75">{isLoading ? "—" : filteredMovies.length}</span>
                            <span>titles in your library</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={layout} items={layoutOptions} onValueChange={(value) => handleLayoutChange(String(value))}>
                                <SelectTrigger className="h-8 w-40 rounded-lg border-white/8 bg-white/4 px-3 text-xs text-white/75 shadow-none hover:border-white/15 hover:bg-white/8">
                                    <SelectValue>
                                        {layoutOptions.find((option) => option.value === layout)?.label.icon}
                                        {layoutOptions.find((option) => option.value === layout)?.label.text}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {layoutOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className="flex items-center gap-2 text-white/75">
                                            {option.label.icon}
                                            {option.label.text}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select items={sortOptions} value={sortBy} onValueChange={(value) => handleSortChange(String(value))}>
                                <SelectTrigger className="h-8 w-36 rounded-lg border-white/8 bg-white/4 px-3 text-xs text-white/75 shadow-none hover:border-white/15 hover:bg-white/8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleSortDirectionChange()}
                                className="border-white/8 bg-white/4 px-3 text-xs text-white/75 shadow-none hover:border-white/15 hover:bg-white/10 dark:bg-white/4 hover:text-white"
                            >
                                {sortDirection === "desc"
                                    ? <ArrowDownWideNarrow size={14} />
                                    : <ArrowUpWideNarrow size={14} />
                                }
                            </Button>

                        </div>
                    </div>
                    <div className={layout === "poster" ? "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:gap-x-5 md:gap-y-8 xl:grid-cols-4 2xl:grid-cols-5" : layout === "compact" ? "grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:gap-x-4 md:gap-y-6 xl:grid-cols-5 2xl:grid-cols-6" : "flex flex-col gap-3"}>
                        {filteredMovies.map((movie) => (
                            <MovieCard
                                key={movie.title}
                                movie={movie}
                                onChangeMovie={setMovieForChange}
                                onChangePoster={setMovieForPosterChange}
                                layout={layout}
                            />
                        ))}
                        {!isLoading && !error && filteredMovies.length === 0 && (
                            <div className="col-span-full flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2 text-center">
                                <Search size={22} className="mb-3 text-white/25" />
                                <p className="text-sm text-white/60">No movies match your search</p>
                                <p className="mt-1 text-xs text-white/35">Try changing your search or filters.</p>
                            </div>
                        )}
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
            {movieForChange && (
                <Dialog
                    open={movieForChange !== null}
                    onOpenChange={(open) => { if (!open) setMovieForChange(null); }}
                >
                    <MovieSelectionModal
                        movie={movieForChange}
                        onClose={() => setMovieForChange(null)}
                    />
                </Dialog>
            )}

            {movieForPosterChange && (
                <Dialog
                    open={movieForPosterChange !== null}
                    onOpenChange={(open) => { if (!open) setMovieForPosterChange(null); }}
                >
                    <MoviePosterSelectionModal
                        movie={movieForPosterChange}
                        onClose={() => setMovieForPosterChange(null)}
                    />
                </Dialog>
            )}

        </div>
    )
}

export default MovieListPage;
