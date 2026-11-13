import PosterFallback from "#components/fallbacks/poster-fallback";
import { Button } from "#components/ui/button";
import { ArrowLeft, CalendarDays, Clapperboard, Clock3, ExternalLink, FilePlus2, Film, Folder, FolderOpen, Globe2, Languages, Play, RefreshCcw, Search, Star, Subtitles } from "lucide-react";
import { Link, useParams } from "react-router";
import { useGetMovie } from "#hooks/services/useGetMovie";
import { useEffect, useMemo, useState } from "react";
import { Genre, Movie } from "../types/movies";
import { formatDate, getCountryName, showToast } from "../utils/common";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "#components/ui/context-menu";
import { Dialog } from "#components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#components/ui/select";
import prettyBytes from "pretty-bytes";
import langs from "langs";
import MoviePosterSelectionModal from "../modals/movies/poster-selection";
import MovieBackgroundSelectionModal from "../modals/movies/background-selection";
import { useUpdateMovieFiles } from "#hooks/actions/useUpdateMovieFiles";
import { MovieLocalSubtitle } from "../../main/types/movies";

const MovieDetailsPage = () => {
    const { movieId } = useParams();
    const { data, isLoading, error } = useGetMovie(Number(movieId));
    const movie = data as Movie | undefined;

    const { resolution, extension, audioCodecs, audioLanguagesItems, subtitleFiles, subtitleLanguagesItems, genres, countries } = useMemo(() => {
        const resolution: { tag: string; width: number; height: number } = movie?.resolution ? JSON.parse(movie.resolution) : { tag: "", width: 0, height: 0 };
        const extension: string = movie?.videoFile ? movie.videoFile.split(".").pop() || "" : "";
        const audioCodecs: string[] = movie?.audioCodecs ? JSON.parse(movie.audioCodecs) : [];
        const audioLanguages: string[] = movie?.audioLanguages ? JSON.parse(movie.audioLanguages) : [];
        const subtitleLanguages: string[] = movie?.subtitleLanguages ? JSON.parse(movie.subtitleLanguages) : [];
        const subtitleFiles: MovieLocalSubtitle[] = movie?.subtitleFiles ? JSON.parse(movie.subtitleFiles) : [];

        let audioLanguagesItems: SelectItem[] = [
            ...audioLanguages.map((language) => ({
                value: language,
                label: language != "und" ? langs.where("1", language)?.name || language : "Unknown",
            })),
        ]

        let subtitleLanguagesItems: SelectItem[] = [
            {
                value: "none",
                label: "None",
            },
            ...subtitleLanguages.map((language) => ({
                value: language,
                label: language != "und" ? langs.where("1", language)?.name || language : "Unknown",
            })),
            ...subtitleFiles.map((subtitleFile: MovieLocalSubtitle, index: number) => {
                const language = subtitleFile.language.split("-")[0];
                return {
                    value: subtitleFile.language,
                    label: `${language != "und" ? langs.where("1", language)?.name || language : "Unknown"} (File ${index + 1})`,
                }
            }),
        ]

        const genres: Genre[] = movie?.genres ? JSON.parse(movie.genres) : [];
        const countries: string[] = movie?.countries ? JSON.parse(movie.countries).map((country: string) => getCountryName(country)) : [];

        return { resolution, extension, audioCodecs, audioLanguagesItems, subtitleFiles, subtitleLanguagesItems, genres, countries };
    }, [movie]);

    const [openPosterMenu, setOpenPosterMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setOpenPosterMenu(false);
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, []);

    const [openBackdropMenu, setOpenBackdropMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => setOpenBackdropMenu(false);
        window.addEventListener("scroll", handleScroll, true);
        return () => window.removeEventListener("scroll", handleScroll, true);
    }, []);


    const [subtitleLanguage, setSubtitleLanguage] = useState<string>("none");
    const [subtitleFile, setSubtitleFile] = useState<string | null>(null);

    const handleSubtitleChange = (value: string) => {
        setSubtitleLanguage(value);
        if (value.includes("-")) {
            const subtitle = subtitleFiles.find((subtitle) => subtitle.language === value);
            setSubtitleFile(subtitle ? subtitle.file : null);
        }
    }

    const [audioLanguage, setAudioLanguage] = useState<string>("");

    useEffect(() => {
        if (!movie) return;
        setSubtitleLanguage(movie.selectedSubtitleLanguage || "none");
        setAudioLanguage(movie.selectedAudioLanguage || "");
        setSubtitleFile(subtitleFiles[0]?.file || null);
    }, [movie]);

    const handlePlayMovie = async () => {
        if (!movie) return;
        const result = await window.electron.playMovie(movie.folder, movie.videoFile, subtitleFile ? subtitleFile : subtitleLanguage, audioLanguage);
        if (!result.success) showToast({
            title: "Error playing movie",
            message: result.message,
            type: "error",
        });
    }

    const [openPosterSelection, setOpenPosterSelection] = useState(false);

    const handleOpenPosterSelection = () => {
        setOpenPosterSelection(true);
    };

    const [openBackgroundSelection, setOpenBackgroundSelection] = useState(false);

    const handleOpenBackgroundSelection = () => {
        setOpenBackgroundSelection(true);
    };

    const changePoster = useUpdateMovieFiles();

    const handleChangePoster = async () => {
        if (!movie) return;
        try {
            const result = await changePoster.mutateAsync({ movieId: movie.id, folder: movie.folder });
            showToast({
                title: "Action successful",
                message: result.message,
                type: "success",
            });
        } catch (error) {
            showToast({
                title: "Action failed",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    }

    if (isLoading) {
        return <div className="mx-auto flex h-screen w-full max-w-375 items-center justify-center p-6 text-sm text-white/45">Loading movie details…</div>;
    }

    if (error || !movie) {
        return (
            <div className="mx-auto flex h-screen w-full max-w-375 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/45"><Film size={24} /></div>
                <div><h1 className="text-lg font-medium text-white/85">Movie not found</h1><p className="mt-1 text-sm text-white/40">This title is not available in your library.</p></div>
                <Button render={<Link to="/" />} variant="ghost" className="rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"><ArrowLeft /> Back to library</Button>
            </div>
        );
    }


    return (
        <div className="mx-auto flex h-screen w-full max-w-[1800px] flex-col overflow-y-auto p-4 text-white md:p-7">
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
                                    {movie.originalTitle && movie.originalTitle.toLowerCase() !== movie.title.toLowerCase() && (
                                        <span className="text-sm leading-normal text-white/40 md:text-base">
                                            ({movie.originalTitle})
                                        </span>
                                    )}
                                </div>
                                <p className="mt-3 max-w-2xl text-sm text-white/60 font-semibold">{movie.tagline}</p>
                                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
                                    <span className="flex items-center gap-1.5"><Clock3 size={14} />{movie.duration || "Runtime unavailable"}</span>
                                    <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {formatDate(movie.releaseDate)}</span>
                                    <span className="flex items-center gap-1.5"><Star size={14} className="text-white/50" />{movie.voteAverage?.toFixed(1) || "0.0"} / 10</span>
                                    <span className="flex items-center gap-1.5"><Globe2 size={14} />{countries.join(", ") || "Unknown"}</span>
                                    <span className="flex items-center gap-1.5"><Languages size={14} />{movie?.originalLanguage && langs.where("1", movie.originalLanguage)?.name || "Unknown"}</span>
                                </div>
                                <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65 md:text-base">{movie.overview}</p>
                                <div className="mt-7 flex flex-wrap gap-3">
                                    <Button onClick={handlePlayMovie} type="button" className="h-11 gap-2 rounded-xl bg-cyan-100 px-5 text-zinc-950 hover:bg-cyan-50">
                                        <Play size={16} fill="currentColor" />Play movie
                                    </Button>
                                    <Button type="button" variant="ghost" className="h-11 gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-white/75 hover:bg-white/10 hover:text-white">
                                        <FolderOpen size={16} />Open folder
                                    </Button>
                                    <Button type="button" variant="ghost" className="h-11 gap-2 rounded-xl border border-emerald-200/15 bg-emerald-300/5 px-4 text-emerald-100/75 hover:bg-emerald-300/10 hover:text-emerald-50"><Star size={14} />
                                        Review on Letterboxd <ExternalLink size={13} />
                                    </Button>
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
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/55"><Film size={14} className="text-cyan-100/70" />Media metadata</div>
                            <p className="mt-1 text-[11px] text-white/35">Technical specs & track preferences</p>
                        </div>
                        <span className="rounded-full border border-cyan-200/10 bg-cyan-200/5 px-2 py-1 text-[9px] uppercase tracking-wider text-cyan-100/55">Video file</span>
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
                                <SelectTrigger
                                    aria-label="Audio language" size="sm"
                                    className="h-8 min-w-40 rounded-md border-white/8 bg-white/5 px-2 text-xs text-white/75 shadow-none dark:bg-white/5"
                                >
                                    <SelectValue placeholder="Unknown" />
                                </SelectTrigger>
                                <SelectContent className="border-white/10 bg-zinc-950 text-white">
                                    {audioLanguagesItems.map((item) =>
                                        <SelectItem
                                            key={item.value} value={item.value}
                                            className="text-white/75 focus:bg-white/10 focus:text-white"
                                        >
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
                                <SelectTrigger
                                    aria-label="Subtitle language" size="sm"
                                    className="h-8 min-w-40 rounded-md border-white/8 bg-white/5 px-2 text-xs text-white/75 shadow-none dark:bg-white/5"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-white/10 bg-zinc-950 text-white">
                                    {subtitleLanguagesItems.map((item) =>
                                        <SelectItem key={item.value} value={item.value} className="text-white/75 focus:bg-white/10 focus:text-white">
                                            {item.label}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                <aside className="rounded-2xl border border-white/8 bg-black/20 p-5 md:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/50">
                            <Folder size={14} className="text-cyan-100/60" /> Local files
                        </div>
                        <Button
                            onClick={handleChangePoster}
                            size="xs" type="button"
                            className="border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                        >
                            <RefreshCcw size={12} />
                            Update
                        </Button>

                    </div>
                    <div className="space-y-2.5">
                        <div className="rounded-xl border border-white/7 bg-white/2.5 p-3">
                            <div className="mb-1.5 flex justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                                <span>Movie file</span>
                                <span className="rounded border border-white/8 bg-white/5 px-1.5 py-0.5 text-[9px]">VIDEO</span>
                            </div>
                            <div className="truncate text-xs text-white/75">
                                {movie.videoFile}
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-white/2.5 p-3">
                            <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                                <span>Subtitle file</span>
                                <span className="rounded border border-cyan-200/10 bg-cyan-200/5 px-1.5 py-0.5 text-[9px] text-cyan-100/70">
                                    {subtitleFiles.length > 0 ? `${subtitleFiles.length} ${subtitleFiles.length === 1 ? 'FILE' : 'FILES'}` : 'NO FILES'}
                                </span>
                            </div>
                            <div className="truncate text-xs text-white/75">
                                {subtitleFile ? subtitleFile : 'No subtitle file selected'}
                            </div>
                            <div className="mt-2.5 grid grid-cols-2 gap-2">
                                <Button type="button" variant="ghost" size="sm" className="h-8 justify-start gap-1.5 rounded-lg border border-white/8 px-2 text-[11px] text-white/50">
                                    <FilePlus2 size={13} />
                                    Add file
                                </Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 justify-start gap-1.5 rounded-lg border border-cyan-200/10 bg-cyan-200/5 px-2 text-[11px] text-cyan-100/70">
                                    <Search size={13} />
                                    Find online
                                </Button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-white/2.5 p-3">
                            <div className="mb-1.5 flex justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                                <span>Torrent file</span>
                                <span className="rounded border border-white/8 bg-white/5 px-1.5 py-0.5 text-[9px]">OPTIONAL</span>
                            </div>
                            <div className="text-xs text-white/45">
                                No torrent file added
                            </div>
                            <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 w-full justify-start gap-2 rounded-lg border border-dashed border-white/10 text-xs text-white/50">
                                <FilePlus2 size={14} />
                                Add torrent file
                            </Button>
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
            <Dialog open={openPosterSelection} onOpenChange={setOpenPosterSelection}>
                <MoviePosterSelectionModal
                    movie={movie}
                    onClose={() => setOpenPosterSelection(false)}
                />
            </Dialog>
            <Dialog open={openBackgroundSelection} onOpenChange={setOpenBackgroundSelection}>
                <MovieBackgroundSelectionModal movie={movie} onClose={() => setOpenBackgroundSelection(false)} />
            </Dialog>
        </div>
    );
};

export default MovieDetailsPage;
