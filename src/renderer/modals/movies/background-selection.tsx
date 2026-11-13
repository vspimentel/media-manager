import { DialogContent } from "#components/ui/dialog";
import { Button } from "#components/ui/button";
import { Check, Image, PanelsTopLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Movie } from "../../types/movies";
import { MovieImage } from "../../../main/types/movies";
import { useGetMovieImages } from "#hooks/services/useGetMoviePosters";
import { useChangeImage } from "#hooks/actions/useChangePoster";
import { showToast } from "../../utils/common";


const MovieBackgroundSelectionModal = ({ movie, onClose }: { movie: Movie; onClose: () => void }) => {
    const { data, isLoading, error } = useGetMovieImages(movie.tmbdId, "backdrop");
    const backgrounds = data ?? [];
    const [selectedBackground, setSelectedBackground] = useState<MovieImage | null>(null);

    useEffect(() => {
        if (movie.backdropFilename) {
            const currentBackground = backgrounds.find((bg) => bg.file === movie.backdropFilename);
            setSelectedBackground(currentBackground ?? null);
        } else {
            setSelectedBackground(backgrounds.length > 0 ? backgrounds[0] : null);
        }
    }, [backgrounds, movie.backdropFilename]);

    const changePoster = useChangeImage();

    const handleChangePoster = async () => {
        if (!selectedBackground) return
        try {
            const result = await changePoster.mutateAsync({ movieId: movie.id, imagePath: selectedBackground.file, type: "backdrop" });
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
    }

    return (
        <DialogContent data-movie-id={movie.id} className="grid h-[min(94vh,760px)] max-h-[94vh] w-[min(96vw,1100px)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-0 text-white shadow-2xl backdrop-blur-xl sm:max-w-none">
            <header className="border-b border-white/10 px-6 pb-5 pt-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45"><PanelsTopLeft size={15} /> Background artwork</div>
                <div className="flex items-end justify-between gap-3 pr-8">
                    <div>
                        <h2 className="text-xl font-light tracking-tight">Choose a background</h2>
                        <p className="mt-1.5 text-sm text-white/50">
                            Browse backdrop images for <span className="text-white/80">{movie.title}</span>
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden md:grid-cols-[minmax(0,1fr)_290px] md:grid-rows-1">
                <div className="soft-scrollbar min-h-0 overflow-y-auto p-5 md:p-6">
                    {isLoading ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-video animate-pulse rounded-xl border border-white/6 bg-white/5" />)}
                    </div> : error ?
                        <div className="rounded-xl border border-rose-300/10 bg-rose-300/5 p-5 text-sm text-rose-100/60">
                            Background images could not be loaded.
                        </div> : backgrounds.length === 0 ?
                            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 text-center">
                                <Image size={22} className="mb-3 text-white/30" />
                                <p className="text-sm text-white/55">
                                    No backgrounds available
                                </p>
                                <p className="mt-1 text-xs text-white/30">
                                    TMDB has no backdrop images for this movie.
                                </p>
                            </div> :
                            (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {backgrounds.map((background, index) => {
                                        const selected = selectedBackground?.file === background.file;
                                        return (
                                            <button key={background.file} type="button" aria-label={`Background image ${index + 1}${selected ? ", selected" : ""}`} aria-pressed={selected} onClick={() => setSelectedBackground(background)} className={`group relative overflow-hidden rounded-xl border p-1 text-left transition ${selected ? "border-cyan-200/60 bg-cyan-200/10 ring-2 ring-cyan-200/15" : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"}`}>
                                                <div className="relative aspect-video overflow-hidden rounded-lg bg-black/30">
                                                    <img src={`https://image.tmdb.org/t/p/original${background.file}`}
                                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                                                    <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
                                                    <span className="absolute bottom-2 left-3 text-[10px] font-medium text-white/75 uppercase">
                                                        Backdrop {String(index + 1).padStart(2, "0")}
                                                    </span>
                                                </div>
                                                {selected && <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-200 text-zinc-950">
                                                    <Check size={12} strokeWidth={2.5} />
                                                </span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                    }
                </div>

                <aside className="flex min-h-0 flex-col justify-between gap-4 border-t border-white/10 bg-white/2 p-5 md:border-l md:border-t-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/65">
                            <Image size={14} className="text-cyan-100/65" />
                            Preview
                        </div>
                        <span className="rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5 text-[10px] text-white/35">16:9</span>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-cyan-200/20 bg-white/5 shadow-xl shadow-black/30">
                        {selectedBackground ? <img src={`https://image.tmdb.org/t/p/original${selectedBackground.file}`} alt={`${movie.title} selected background preview`} className="absolute inset-0 h-full w-full object-cover" /> : movie.backdrop ? <img src={movie.backdrop} alt={`${movie.title} current background`} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><Image size={24} className="text-white/25" /></div>}
                        <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-black/10" /><span className="absolute bottom-3 left-3 right-3 truncate text-sm font-medium text-white/90">{movie.title}</span>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3"><div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">Selected image</div><div className="mt-1.5 truncate text-xs text-white/70">{selectedBackground ? `Backdrop ${backgrounds.findIndex((image) => image.file === selectedBackground.file) + 1}` : "Choose an image to preview"}</div></div>
                </aside>
            </div>
            <footer className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] text-white/35">
                    <span className="size-1.5 rounded-full bg-cyan-200/70" />
                    Wide images for the movie hero
                </div>
                <Button
                    type="button" variant="ghost"
                    size="xs" onClick={handleChangePoster}
                    className="rounded-lg border border-white/10 text-white/55 hover:border-white/20 hover:bg-white/10 hover:text-white/80"
                >
                    Select background
                </Button>
            </footer>
        </DialogContent>
    );
};

export default MovieBackgroundSelectionModal;
