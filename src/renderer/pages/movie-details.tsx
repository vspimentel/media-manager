import PosterFallback from "#components/fallbacks/poster-fallback";
import { Button } from "#components/ui/button";
import { ArrowLeft, CalendarDays, Clapperboard, Clock3, ExternalLink, FilePlus2, Film, Folder, FolderOpen, Globe2, Languages, Link2, Loader, LoaderCircle, Play, RefreshCcw, Search, Star, Subtitles } from "lucide-react";
import { Link, useParams } from "react-router";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "#components/ui/context-menu";
import { Dialog } from "#components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#components/ui/select";
import prettyBytes from "pretty-bytes";
import { useGetMovie } from "#hooks/services/movies/useGetMovie";
import { formatDate, getCountryName, getLanguageName, showToast } from "#utils/common";
import { useUpdateMovieFiles } from "#hooks/actions/movies/useUpdateMovieFiles";
import { useAddSubtitleFile } from "#hooks/actions/subtitles/useAddSubtitleFile";
import MoviePosterSelectionModal from "#components/modals/movies/poster-selection";
import MovieBackgroundSelectionModal from "#components/modals/movies/background-selection";
import { Genre, Movie } from "#types/movies";
import { useLetterboxdReview } from "#hooks/services/movies/useLetterboxdReview";
import { useLetterboxdSession } from "#hooks/services/config/useLetterboxdSession";
import { useCalculateHash } from "#hooks/actions/movies/useCalculateHash";
import SubtitlesSearchModal from "#components/modals/movies/subtitles-search";
import SourcesListModal from "#components/modals/movies/sources-list";
import { DownloadSource, SubtitleFile } from "../../main/types/common";


const MovieDetailsPage = () => {
    const { movieId } = useParams();
    const { data, isLoading, error } = useGetMovie(Number(movieId));
    const movie = data as Movie | undefined;

    const { resolution, extension, audioCodecs, audioLanguagesItems, subtitleFiles, subtitleLanguagesItems, torrents, links, genres, countries } = useMemo(() => {
        const resolution: { tag: string; width: number; height: number } = movie?.resolution ? JSON.parse(movie.resolution) : { tag: "", width: 0, height: 0 };
        const extension: string = movie?.videoFile ? movie.videoFile.split(".").pop() || "" : "";
        const audioCodecs: string[] = movie?.audioCodecs ? JSON.parse(movie.audioCodecs) : [];
        const audioLanguages: string[] = movie?.audioLanguages ? JSON.parse(movie.audioLanguages) : [];
        const subtitleLanguages: string[] = movie?.subtitleLanguages ? JSON.parse(movie.subtitleLanguages) : [];
        const subtitleFiles: SubtitleFile[] = movie?.subtitleFiles ? JSON.parse(movie.subtitleFiles) : [];

        let audioLanguagesItems: SelectItem[] = [
            ...audioLanguages.map((language) => ({
                value: language,
                label: language != "und" ? getLanguageName(language) || language : "Unknown",
            })),
        ]

        let subtitleLanguagesItems: SelectItem[] = [
            {
                value: "none",
                label: "None",
            },
            ...subtitleLanguages.map((language) => ({
                value: language,
                label: language != "und" ? getLanguageName(language) || language : "Unknown",
            })),
            ...subtitleFiles.map((subtitleFile: SubtitleFile) => {
                const language = subtitleFile.language.split("-")[0];
                return {
                    value: subtitleFile.language,
                    label: `${language != "und" ? getLanguageName(language) || language : "Unknown"} (File)`,
                }
            }),
        ]

        const torrents: DownloadSource[] = movie?.sources ? JSON.parse(movie.sources).filter((source: DownloadSource) => source.type === "torrent") : [];
        const links: DownloadSource[] = movie?.sources ? JSON.parse(movie.sources).filter((source: DownloadSource) => source.type === "link") : [];
        const genres: Genre[] = movie?.genres ? JSON.parse(movie.genres) : [];
        const countries: string[] = movie?.countries ? JSON.parse(movie.countries).map((country: string) => getCountryName(country)) : [];

        return { resolution, extension, audioCodecs, audioLanguagesItems, subtitleFiles, subtitleLanguagesItems, torrents, links, genres, countries };
    }, [movie]);

    const handlePlayMovie = async () => {
        if (!movie) return;
        const result = await window.electron.playMovie(movie.id, subtitleFile ? subtitleFile : subtitleLanguage, audioLanguage);
        if (!result.success) showToast({
            title: "Error playing movie",
            message: result.message,
            type: "error",
        });
    }

    const handleOpenFolder = async () => {
        if (!movie) return;
        const result = await window.electron.openFolder("movies", movie.folder);
        if (!result.success) showToast({
            title: "Error opening folder",
            message: result.message,
            type: "error",
        });
    }

    const { mutateAsync: makeReviewOnLetterboxd, isPending: isMakingReviewOnLetterboxd } = useLetterboxdReview();
    const { username } = useLetterboxdSession();

    const handleMakeReviewOnLetterboxd = async () => {
        if (!movie || !username) return;
        try {
            const result = await makeReviewOnLetterboxd({ movieId: movie.id });
            showToast({
                title: "Review posted",
                message: result.message,
                type: result.success ? "success" : "error",
            });
        } catch (error) {
            showToast({
                title: "Could not post review",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    };

    const [openPosterMenu, setOpenPosterMenu] = useState(false);
    const [openBackdropMenu, setOpenBackdropMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setOpenPosterMenu(false);
            setOpenBackdropMenu(false);
        };
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, []);

    const [openPosterSelection, setOpenPosterSelection] = useState(false);

    const handleOpenPosterSelection = () => {
        if (!movie || !movie.tmbdId) {
            showToast({
                title: "Error opening poster selection",
                message: "This movie does not have a TMDB ID, so poster selection is unavailable.",
                type: "error",
            });
            return;
        }
        setOpenPosterSelection(true);
    };

    const [openBackgroundSelection, setOpenBackgroundSelection] = useState(false);

    const handleOpenBackgroundSelection = () => {
        if (!movie || !movie.tmbdId) {
            showToast({
                title: "Error opening background selection",
                message: "This movie does not have a TMDB ID, so background selection is unavailable.",
                type: "error",
            });
            return;
        }
        setOpenBackgroundSelection(true);
    };

    const [audioLanguage, setAudioLanguage] = useState<string>("");

    useEffect(() => {
        if (!movie) return;
        setSubtitleLanguage(movie.selectedSubtitleLanguage || "none");
        setAudioLanguage(movie.selectedAudioLanguage || "");
        setSubtitleFile(subtitleFiles[0]?.file || null);
    }, [movie]);

    const [subtitleLanguage, setSubtitleLanguage] = useState<string>("none");
    const [subtitleFile, setSubtitleFile] = useState<string | null>(null);

    const handleSubtitleChange = (value: string) => {
        setSubtitleLanguage(value);
        if (value.includes("-")) {
            const subtitle = subtitleFiles.find((subtitle) => subtitle.language === value);
            setSubtitleFile(subtitle ? subtitle.file : null);
        }
    }

    const updateFiles = useUpdateMovieFiles();

    const handleUpdateFiles = async () => {
        if (!movie) return;
        try {
            const result = await updateFiles.mutateAsync({ movieId: movie.id, folder: movie.folder });
            showToast({
                title: "Files updated",
                message: result.message,
                type: result.success ? "success" : "error",
            });
        } catch (error) {
            showToast({
                title: "Files not updated",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    }

    const handleOpenLocalFile = async (file: string) => {
        if (!movie) return;
        const result = await window.electron.openLocalFile("movies", movie.folder, file);
        if (!result.success) showToast({
            title: "Error opening file",
            message: result.message,
            type: "error",
        });
    }

    const subtitleInputRef = useRef<HTMLInputElement>(null);

    const addSubtitleFile = useAddSubtitleFile();

    const handleAddSubtitleFile = async (file: File) => {
        if (!movie) return;
        try {
            const result = await addSubtitleFile.mutateAsync({ movieId: movie.id, folder: movie.folder, subtitleFile: file });
            showToast({
                title: "Subtitle file added",
                message: result.message,
                type: result.success ? "success" : "error",
            });

        } catch (error) {
            showToast({
                title: "Subtitle file not added",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    };

    const [openSubtitleSearch, setOpenSubtitleSearch] = useState(false);
    const { mutateAsync: calculateHash, isPending: isCalculatingHash } = useCalculateHash();

    const handleOpenSubtitleSearch = async () => {
        if (!movie) return;
        if (!movie.ohash) {
            try {
                const result = await calculateHash({ movieId: movie.id });
                if (!result.success) {
                    showToast({
                        title: "Error calculating hash",
                        message: result.message,
                        type: "error",
                    });
                }
            } catch (error) {
                showToast({
                    title: "Could not calculate hash",
                    message: error instanceof Error ? error.message : "An unexpected error occurred",
                    type: "error",
                });
            }
        }
        setOpenSubtitleSearch(true);
    };

    const [openSourcesList, setOpenSourcesList] = useState(false);

    if (isLoading) {
        return <div className="mx-auto flex h-full w-full max-w-375 items-center justify-center p-6 text-sm text-white/45">Loading movie details…</div>;
    }

    if (error || !movie) {
        return (
            <div className="mx-auto flex h-full w-full max-w-375 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/45"><Film size={24} /></div>
                <div><h1 className="text-lg font-medium text-white/85">Movie not found</h1><p className="mt-1 text-sm text-white/40">This title is not available in your library.</p></div>
                <Button render={<Link to="/" />} variant="ghost" className="rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"><ArrowLeft /> Back to library</Button>
            </div>
        );
    }

    return (
        <div className="soft-scrollbar mx-auto flex h-full w-full max-w-[1800px] flex-col overflow-y-auto p-4 text-white md:p-7">
            <ContextMenu open={openBackdropMenu} onOpenChange={setOpenBackdropMenu}>
                <ContextMenuTrigger className="relative isolate min-h-140 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl md:min-h-155">
                    <img
                        src={movie?.backdrop || movie?.poster || "/assets/images/poster-fallback.png"}
                        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,9,11,0.96)_0%,rgba(9,9,11,0.78)_55%,rgba(9,9,11,0.42)_100%),linear-gradient(0deg,rgba(9,9,11,0.96)_0%,transparent_65%)]" />
                    <div className="relative flex justify-between min-h-140 flex-col md:min-h-155">
                        <nav className="flex items-center justify-between p-5 md:px-8 md:pt-7">
                            <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/60 transition hover:bg-white/8 hover:text-white">
                                <ArrowLeft size={16} /> Library
                            </Link>
                            <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
                                <Clapperboard size={14} /> FRAME / MOVIES
                            </span>
                        </nav>
                        <div className="grid items-start grid-cols-12 gap-8 px-5 pb-8 pt-10 md:gap-10 md:px-10 md:pb-12">
                            <ContextMenu open={openPosterMenu} onOpenChange={setOpenPosterMenu}>
                                <ContextMenuTrigger className="col-span-3 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-black/50 w-full">
                                    <div >
                                        <div className="aspect-2/3">{movie.poster ? <img src={movie.poster} className="h-full w-full object-cover" /> : <PosterFallback iconSize={42} />}</div>
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="min-w-48 rounded-xl border-white/10 bg-black/70 p-1 text-white shadow-2xl backdrop-blur-xl">
                                    <ContextMenuItem
                                        className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white"
                                        onClick={handleOpenPosterSelection}
                                    >
                                        Change movie poster
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                            <div className="min-w-0 col-span-9">
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {genres.map((genre, index) => <span key={index} className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] text-white/55">
                                        {genre.name}
                                    </span>)}
                                </div>
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                                    <h1 className="max-w-4xl text-4xl font-light leading-tight tracking-tight text-white md:text-6xl">
                                        {movie.title}
                                    </h1>
                                    {movie.originalTitle && movie.originalTitle.toLowerCase() !== (movie.title || movie.folder).toLowerCase() && (
                                        <span className="text-sm leading-normal text-white/40 md:text-base">
                                            ({movie.originalTitle})
                                        </span>
                                    )}
                                </div>
                                <p className="mt-3 max-w-2xl text-sm text-white/60 font-semibold">{movie.tagline}</p>
                                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
                                    <span className="flex items-center gap-1.5">
                                        <Clock3 size={14} />{movie.duration || "Runtime unavailable"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays size={14} /> {formatDate(movie.releaseDate)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Star size={14} className="text-white/50" />{movie.voteAverage?.toFixed(1) || "-"}/10
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Globe2 size={14} />{countries.join(", ") || "Unknown"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Languages size={14} />{movie?.originalLanguage && getLanguageName(movie.originalLanguage) || "Unknown"}
                                    </span>
                                </div>
                                <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65 md:text-base">{movie.overview}</p>
                                <div className="mt-7 flex flex-wrap gap-3">
                                    <Button onClick={handlePlayMovie} type="button" className="h-11 gap-2 rounded-xl bg-cyan-100 px-5 text-zinc-950 hover:bg-cyan-50 hover:text-zinc-950">
                                        <Play size={16} fill="currentColor" />Play movie
                                    </Button>
                                    <Button onClick={handleOpenFolder} type="button" variant="ghost" className="h-11 gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-white/75 hover:bg-white/10 hover:text-white">
                                        <FolderOpen size={16} />Open folder
                                    </Button>
                                    <div className="flex h-11 items-center overflow-hidden rounded-xl border border-emerald-200/15 bg-emerald-300/5">
                                        {movie?.rating ? (
                                            <div className="flex h-full items-center gap-2 border-r border-emerald-200/10 px-3">
                                                <Star size={14} fill="currentColor" className="text-amber-100/80" />
                                                <span className="text-sm font-medium tabular-nums text-white/80">{movie.rating}</span>
                                                <span className="text-[9px] uppercase tracking-[0.12em] text-white/35">Your rating</span>
                                            </div>
                                        ) : (
                                            <div aria-label="Your rating: not rated" className="flex h-full items-center gap-2 border-r border-emerald-200/10 px-3">
                                                <Star size={14} className="text-white/35" />
                                                <span className="text-xs font-medium text-white/45">Not rated</span>
                                            </div>
                                        )}
                                        <Button
                                            onClick={handleMakeReviewOnLetterboxd}
                                            type="button" variant="ghost"
                                            className="h-full gap-2 w-44 flex justify-center rounded-none px-3 text-xs text-emerald-100/75 hover:bg-emerald-300/10 hover:text-emerald-50"
                                        >
                                            {isMakingReviewOnLetterboxd
                                                ? <>Making review... <LoaderCircle size={13} className="animate-spin" /></>
                                                : <>Review on Letterboxd <ExternalLink size={13} /></>
                                            }

                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="min-w-48 rounded-xl border-white/10 bg-black/70 p-1 text-white shadow-2xl backdrop-blur-xl">
                    <ContextMenuItem
                        className="rounded-lg px-2 py-1 text-sm font-light data-highlighted:bg-white/10 data-highlighted:text-white"
                        onClick={handleOpenBackgroundSelection}
                    >
                        Change background image
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section className="flex flex-col rounded-2xl border border-white/8 bg-linear-to-br from-white/4.5 to-black/20 p-5 shadow-xl shadow-black/10 md:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/8 pb-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/55"><Film size={14} className="text-cyan-100/70" />
                                Video metadata
                            </div>
                            <p className="mt-1 text-[11px] text-white/35">
                                Technical specs & track preferences
                            </p>
                        </div>
                        <span className="rounded border border-cyan-200/10 bg-cyan-200/5 px-2 py-1 text-[9px] uppercase tracking-wider text-cyan-100/55">
                            Video file
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-linear-to-br from-white/5.5 to-white/1.5 p-3.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-100/10 bg-cyan-100/5 text-[9px] font-semibold tracking-wide text-cyan-100/70">
                                FILE
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white/35">
                                    File Size
                                </span>
                                <span className="mt-1 block text-sm font-medium tabular-nums text-white/80">
                                    {prettyBytes(movie.filesize)} {`(${extension.toLocaleUpperCase()})`}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-linear-to-br from-white/5.5 to-white/1.5 p-3.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-100/10 bg-cyan-100/5 text-[9px] font-semibold tracking-wide text-cyan-100/70">
                                RES
                            </span>
                            <span className="min-w-0"><span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white/35">
                                Resolution
                            </span>
                                <span className="mt-1 block text-sm font-medium tabular-nums text-white/80">
                                    {resolution.tag ? `${resolution.tag} (${resolution.width} × ${resolution.height})` : '—'}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-linear-to-br from-white/5.5 to-white/1.5 p-3.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-100/10 bg-cyan-100/5 text-[9px] font-semibold tracking-wide text-cyan-100/70">
                                VID
                            </span>
                            <span className="min-w-0"><span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white/35">
                                Video codec
                            </span>
                                <span className="mt-1 block text-sm font-medium tabular-nums text-white/80">
                                    {movie.videoCodec || '—'}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-linear-to-br from-white/5.5 to-white/1.5 p-3.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-100/10 bg-cyan-100/5 text-[9px] font-semibold tracking-wide text-cyan-100/70">
                                AUD
                            </span>
                            <span className="min-w-0"><span className="block truncate text-[9px] uppercase tracking-[0.12em] text-white/35">
                                Audio codec
                            </span>
                                <span className="mt-1 block text-sm font-medium tabular-nums text-white/80">
                                    {audioCodecs.length > 0 ? audioCodecs.join(', ') : '—'}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2.5 pt-2.5">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-linear-to-br from-white/5.5 to-white/1.5 px-3.5 py-3">
                            <span className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/50">
                                <Languages size={13} className="shrink-0 text-cyan-100/65" />
                                <span>Audio language</span>
                                <span className="rounded-md border border-white/8 bg-black/15 px-1.5 py-0.5 text-[9px] tracking-normal text-white/35">
                                    {audioLanguagesItems.length > 0
                                        ? `${audioLanguagesItems.length} ${audioLanguagesItems.length === 1 ? 'TRACK' : 'TRACKS'}`
                                        : 'NO TRACKS FOUND'
                                    }
                                </span>
                            </span>
                            <Select
                                disabled={audioLanguagesItems.length === 0}
                                value={audioLanguage || null}
                                onValueChange={(value) => setAudioLanguage(value ?? "")}
                                items={audioLanguagesItems}
                            >
                                <SelectTrigger className="min-w-40 rounded-lg border-white/10 bg-white/4 text-xs text-white/75">
                                    <SelectValue placeholder="Unknown" />
                                </SelectTrigger>
                                <SelectContent className="min-w-41">
                                    {audioLanguagesItems.map((item) =>
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-linear-to-br from-white/5.5 to-white/1.5 px-3.5 py-3">
                            <span className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/50">
                                <Subtitles size={13} className="shrink-0 text-cyan-100/65" />
                                <span>Subtitle language</span>
                                <span className="rounded-md border border-white/8 bg-black/15 px-1.5 py-0.5 text-[9px] tracking-normal text-white/35">
                                    {subtitleLanguagesItems.length > 1
                                        ? `${subtitleLanguagesItems.length - 1} ${subtitleLanguagesItems.length === 2 ? 'SUBTITLE' : 'SUBTITLES'}`
                                        : 'NO SUBTITLES FOUND'
                                    }
                                </span>
                            </span>
                            <Select
                                value={subtitleLanguage}
                                onValueChange={(value) => handleSubtitleChange(String(value))}
                                disabled={subtitleLanguagesItems.length === 0}
                                items={subtitleLanguagesItems}
                            >
                                <SelectTrigger className="min-w-40 rounded-lg border-white/10 bg-white/4 text-xs text-white/75">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-41">
                                    {subtitleLanguagesItems.map((item) =>
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                <aside className="rounded-2xl flex flex-col justify-between border border-white/8 bg-black/20 p-5 md:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
                            <Folder size={14} className="text-cyan-100/60" /> Local files
                        </div>
                        <Button
                            onClick={handleUpdateFiles}
                            size="xs" type="button"
                            className="border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                        >
                            <RefreshCcw size={12} />
                            Update
                        </Button>

                    </div>
                    <div className="space-y-2.5">
                        <div className="rounded-xl flex flex-col gap-2 border border-white/7 bg-white/2.5 p-3">
                            <div className="flex justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                                <span>Movie file</span>
                                <span className="rounded border text-[9px] px-1.5 py-0.5 border-cyan-200/10 bg-cyan-200/5 text-cyan-100/70">VIDEO</span>
                            </div>
                            <div
                                className={`truncate text-xs text-white/75 ${movie.videoFile ? "hover:text-white/90 hover:underline cursor-pointer" : ""}`}
                                onClick={() => handleOpenLocalFile(movie.videoFile)}
                            >
                                {movie.videoFile}
                            </div>
                        </div>
                        <div className="rounded-xl flex flex-col gap-2 border border-white/7 bg-white/2.5 p-3">
                            <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                                <span>Subtitle file</span>
                                <span className={`rounded border text-[9px] px-1.5 py-0.5 ${subtitleFiles.length ? "border-cyan-200/10 bg-cyan-200/5 text-cyan-100/70" : "border-white/8 bg-white/5"}`}>
                                    {subtitleFiles.length > 0 ? `${subtitleFiles.length} ${subtitleFiles.length === 1 ? 'FILE' : 'FILES'}` : 'NO FILES'}
                                </span>
                            </div>
                            <div
                                className={`truncate text-xs text-white/75 ${subtitleFile ? "hover:text-white/90 hover:underline cursor-pointer" : ""}`}
                                onClick={() => subtitleFile && handleOpenLocalFile(subtitleFile)}
                            >
                                {subtitleFile ? subtitleFile : 'No subtitle file selected'}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    ref={subtitleInputRef}
                                    type="file"
                                    accept=".srt,.vtt,.ass,.ssa,.sub,.idx,.txt"
                                    className="hidden"
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                                        const file = event.target.files?.[0];
                                        if (file) handleAddSubtitleFile(file);
                                    }}
                                />
                                <Button
                                    type="button" variant="ghost" size="sm"
                                    className="h-8 w-full justify-start gap-1.5 rounded-lg border border-white/8 px-2 text-[11px] text-white/50"
                                    onClick={() => subtitleInputRef.current?.click()}
                                >
                                    <FilePlus2 size={13} />
                                    Add file
                                </Button>
                                <Button
                                    onClick={handleOpenSubtitleSearch}
                                    type="button" variant="ghost" size="sm"
                                    className="h-8 justify-start gap-1.5 rounded-lg border border-cyan-200/10 bg-cyan-200/5 px-2 text-[11px] text-cyan-100/70"
                                >
                                    {isCalculatingHash
                                        ? (<><LoaderCircle size={13} className="animate-spin" /> Hashing...</>)
                                        : (<><Search size={13} /> Find online</>)
                                    }
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl border border-white/7 bg-white/2.5 p-3">
                            <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                                <span>Download sources</span>
                                <span className={`rounded border text-[9px] px-1.5 py-0.5 ${subtitleFiles.length ? "border-cyan-200/10 bg-cyan-200/5 text-cyan-100/70" : "border-white/8 bg-white/5"}`}>
                                    {torrents.length > 0 || links.length > 0 ? `${torrents.length + links.length} ${torrents.length + links.length === 1 ? 'SOURCE' : 'SOURCES'}` : 'NO SOURCES'}
                                </span>
                            </div>
                            <div className="truncate text-xs text-white/75">
                                {torrents.length > 0 || links.length > 0
                                    ? `Torrent files (${torrents.length}) - Download links (${links.length})`
                                    : 'No download sources available'
                                }
                            </div>
                            <div className="gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full gap-1.5 flex justify-center rounded-lg border border-white/8 px-2 text-[11px] text-white/50"
                                    onClick={() => setOpenSourcesList(true)}
                                >
                                    <Link2 size={13} />
                                    Manage sources list
                                </Button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <section className="mb-8 rounded-2xl border border-white/8 bg-black/20 p-5 md:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Cast & crew</div>
                        <h2 className="mt-1 text-lg font-light text-white/85">People behind the film</h2>
                    </div>
                    <span className="text-xs text-white/30">From TMDB</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    {["Cast member", "Cast member", "Cast member", "Cast member", "Director", "Writer"].map((role, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/2.5 p-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/8 bg-linear-to-br from-white/10 to-white/2 text-white/30"><Film size={15} /></div>
                            <div className="min-w-0"><div className="truncate text-xs text-white/65">Name placeholder</div><div className="mt-1 text-[10px] text-white/30">{role}</div></div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-6 rounded-2xl border border-white/8 bg-black/20 p-5 md:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Community</div>
                        <h2 className="mt-1 text-lg font-light text-white/85">Reviews</h2>
                    </div>
                    <span className="text-xs text-white/30">TMDB reviews</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    {[
                        { author: "Goddard", rating: "—", text: "A memorable story with a lot to say about belief, identity, and the people we choose to follow." },
                        { author: "Brett Pascoe", rating: "9 / 10", text: "One of my all-time favorites. A great story that rewards watching again." },
                    ].map((review) => (
                        <article key={review.author} className="rounded-xl border border-white/6 bg-white/2.5 p-4 md:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full border border-white/8 bg-white/5 text-xs text-white/55">{review.author.slice(0, 1)}</div><div className="text-sm text-white/75">{review.author}</div></div>
                                <span className="rounded-md border border-amber-200/10 bg-amber-200/5 px-2 py-1 text-[10px] text-amber-100/65">★ {review.rating}</span>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-white/50">“{review.text}”</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mb-8 rounded-2xl border border-white/8 bg-black/20 p-5 md:p-7">
                <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Discover</div>
                        <h2 className="mt-1 text-lg font-light text-white/85">Similar movies</h2>
                    </div>
                    <span className="text-xs text-white/30">You may also like</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    {[
                        { title: "Orlando", year: "1992", poster: "/xvz0qZkXXMq3dH2Revxii8drxWc.jpg", rating: "7.0" },
                        { title: "Smilla’s Sense of Snow", year: "1997", poster: "/3eeCYGVWb4Ic8SFpARGWOjyl9Md.jpg", rating: "6.4" },
                        { title: "Recommended title", year: "—", poster: "/2w4xG178RpB4MDAIfTkqAuSJzec.jpg", rating: "—" },
                        { title: "Recommended title", year: "—", poster: "/iY2ujEY2m68OTTlPFTiHub9joHS.jpg", rating: "—" },
                        { title: "Recommended title", year: "—", poster: "/pWVLFh4OuejTpUaDQbB1C4zoS2p.jpg", rating: "—" },
                    ].map((similar, index) => (
                        <article key={`${similar.title}-${index}`} className="group min-w-0">
                            <div className="aspect-2/3 overflow-hidden rounded-xl border border-white/8 bg-white/5">
                                <img src={`https://image.tmdb.org/t/p/w500${similar.poster}`} alt={`${similar.title} poster`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                            </div>
                            <div className="mt-2.5 truncate text-sm font-medium text-white/75">{similar.title}</div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-white/35">
                                <span>{similar.year}</span>
                                <span>★ {similar.rating}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            {openPosterSelection && (
                <Dialog open={openPosterSelection} onOpenChange={setOpenPosterSelection}>
                    <MoviePosterSelectionModal
                        movie={movie}
                        onClose={() => setOpenPosterSelection(false)}
                    />
                </Dialog>
            )}
            {openBackgroundSelection && (
                <Dialog open={openBackgroundSelection} onOpenChange={setOpenBackgroundSelection}>
                    <MovieBackgroundSelectionModal
                        movie={movie}
                        onClose={() => setOpenBackgroundSelection(false)}
                    />
                </Dialog>
            )}
            {openSubtitleSearch && (
                <Dialog open={openSubtitleSearch} onOpenChange={setOpenSubtitleSearch}>
                    <SubtitlesSearchModal
                        movie={movie}
                        onClose={() => setOpenSubtitleSearch(false)}
                    />
                </Dialog>
            )}
            {openSourcesList && (
                <Dialog open={openSourcesList} onOpenChange={setOpenSourcesList}>
                    <SourcesListModal movie={movie} />
                </Dialog>
            )}
        </div>
    );
};

export default MovieDetailsPage;
