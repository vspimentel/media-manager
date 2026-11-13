import { DialogContent } from "#components/ui/dialog"
import PosterFallback from "#components/fallbacks/poster-fallback";
import { Check, Clapperboard, Image, Languages } from "lucide-react"
import { Movie } from "../../types/movies";
import { MovieImage } from "../../../main/types/movies";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#components/ui/button";
import { showToast } from "../../utils/common";
import langs from "langs";
import { useGetMovieImages } from "#hooks/services/useGetMoviePosters";
import { useChangeImage } from "#hooks/actions/useChangePoster";

const MoviePosterSelectionModal = ({ movie, onClose }: { movie: Movie; onClose: () => void }) => {

    const { data, isLoading, error } = useGetMovieImages(movie.tmbdId, "poster");

    const { posterGroups, previewGroup, previewPoster } = useMemo(() => {
        const posters = (data ?? []) as MovieImage[];

        const postersByLanguage = posters.reduce((acc, poster) => {
            const language = poster.language || "nt";

            if (!acc[language]) acc[language] = [];
            acc[language].push(poster);

            return acc;
        }, {} as Record<string, MovieImage[]>);

        const groups = Object.entries(postersByLanguage).map(([language, posters]) => ({
            language: language != 'nt' ? langs.where("1", language)?.name : "No Text",
            code: language.toUpperCase(),
            posters,
        }));

        groups.sort((a, b) => {
            if (a.code === "EN") return -1;
            if (b.code === "EN") return 1;
            return (a.language ?? "").localeCompare(b.language ?? "");
        });

        const previewGroup = groups.find((group) => group.code === "EN") || groups[0];

        return {
            posterGroups: groups,
            previewGroup,
            previewPoster: previewGroup?.posters[0],
        };
    }, [data]);

    const [selectedPoster, setSelectedPoster] = useState<MovieImage | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    useEffect(() => {
        if (movie.posterFilename) {
            const currentPoster = posterGroups.flatMap(group => group.posters).find((poster) => poster.file === movie.posterFilename);
            setSelectedPoster(currentPoster ?? null);
            setSelectedLanguage(currentPoster?.language || null);
        } else {
            setSelectedPoster(previewPoster);
            setSelectedLanguage(previewGroup?.code || null);
        }
    }, [posterGroups, previewPoster, previewGroup, movie.posterFilename]);

    const handleSelectPoster = (poster: MovieImage, language: string | null) => {
        setSelectedPoster(poster);
        setSelectedLanguage(language);
    };

    const changePoster = useChangeImage();

    const handleChangePoster = async () => {
        if (!selectedPoster) return
        try {
            const result = await changePoster.mutateAsync({ movieId: movie.id, imagePath: selectedPoster.file, type: "poster" });
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
        <DialogContent
            data-movie-id={movie.id}
            className="h-[min(98vh,760px)] max-h-[98vh] w-[min(96vw,1100px)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-0 text-white shadow-2xl backdrop-blur-xl sm:max-w-none"
        >
            <div className="border-b border-white/10 px-6 pb-5 pt-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    <Clapperboard size={15} /> Poster artwork
                </div>
                <div className="flex flex-wrap items-end justify-between gap-3 pr-8">
                    <div>
                        <h2 className="text-xl font-light tracking-tight">Choose a poster</h2>
                        <p className="mt-1.5 text-sm text-white/50">Browse artwork for <span className="text-white/80">{movie.title}</span></p>
                    </div>
                </div>
            </div>

            <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden md:grid-cols-[minmax(0,1fr)_240px] md:grid-rows-1">
                <div className="soft-scrollbar min-h-0 space-y-6 overflow-y-auto p-5 md:p-6">
                    {posterGroups.map((group, groupIndex) => (
                        <section key={group.code} aria-labelledby={`poster-language-${group.code}`}>
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/50">
                                        <Languages size={15} />
                                    </div>
                                    <div>
                                        <h3 id={`poster-language-${group.code}`} className="text-sm font-medium text-white/80">{group.language}</h3>
                                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/35">{group.code} · {group.posters.length} posters</p>
                                    </div>
                                </div>
                                {groupIndex === 0 && <span className="rounded-full border border-cyan-200/15 bg-cyan-200/8 px-2 py-1 text-[10px] text-cyan-100/65">Popular</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {group.posters.map((poster, index) => {
                                    const selected = selectedPoster?.file === poster.file;
                                    return (
                                        <div
                                            key={`${group.code}-${index}`}
                                            className={`group relative overflow-hidden rounded-xl border p-1 text-left transition duration-300 hover:-translate-y-0.5 ${selected ? "border-cyan-200/60 bg-cyan-200/10 ring-2 ring-cyan-200/15" : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"}`}
                                            onClick={() => handleSelectPoster(poster, group.code)}
                                        >
                                            <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-linear-to-br">
                                                <img src={`https://image.tmdb.org/t/p/original${poster.file}`} alt={`${group.language} poster ${index + 1}`} className="h-full w-full object-cover" />
                                                <span className="absolute inset-x-2 bottom-2 truncate text-center text-[9px] font-medium uppercase tracking-[0.14em] text-white/80">Artwork {group.code} {String(index + 1).padStart(2, "0")}</span>
                                            </div>
                                            {selected && <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-200 text-zinc-950"><Check size={12} strokeWidth={2.5} /></span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                <aside className="flex h-full flex-col items-stretch justify-between border-l border-t-0 border-white/10 bg-white/2 p-5">
                    <div className="flex items-center justify-between ">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/65"><Image size={14} className="text-cyan-100/65" />Poster selected</div>
                        <span className="rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5 text-[10px] text-white/35">2:3</span>
                    </div>

                    <div className="w-full aspect-2/3 rounded-2xl border border-cyan-200/20 bg-cyan-200/4 p-1.5 shadow-xl shadow-black/30 flex justify-center items-center">
                        <div className="relative h-full w-full overflow-hidden rounded-xl">
                            <PosterFallback iconSize={28} />
                            {selectedPoster && (
                                <img
                                    src={`https://image.tmdb.org/t/p/original${selectedPoster.file}`}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                                />
                            )}
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/35">Poster information</div>
                        <div className="mt-2 flex flex-nowrap items-center gap-2 whitespace-nowrap text-[10px] text-white/70">
                            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-white/45">{selectedLanguage?.toUpperCase()}</span>
                            <span>{selectedPoster ? `Dimensions: ${selectedPoster.width} × ${selectedPoster.height} px` : "Dimensions unavailable"}</span>
                        </div>
                    </div>
                </aside>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] text-white/35">
                    <span className="size-1.5 rounded-full bg-cyan-200/70" />
                    Posters are grouped by language
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleChangePoster}
                    className="rounded-lg border border-white/10 text-white/50 hover:border-white/20 hover:bg-white/10 hover:text-white/80"
                >
                    Select Poster
                </Button>
            </div>
        </DialogContent>
    )
}

export default MoviePosterSelectionModal
