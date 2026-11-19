import { Button } from "#components/ui/button";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "#components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#components/ui/select";
import { BadgeCheck, Download, Languages, Loader2, Play, Subtitles } from "lucide-react";
import { useMemo, useState } from "react";
import { Movie } from "#types/movies";
import { usePageContext } from "#hooks/common/usePageContext";
import { useSearchSubtitles } from "#hooks/services/movies/useSearchSubtitles";
import { getLanguageName, showToast, } from "#utils/common";
import { LANGUAGE_OS_CODES, OS_CODES_NAMES } from "#utils/constants";
import { usSaveSubtitleFile } from "#hooks/actions/subtitles/useSaveSubtitleFile";

const SubtitlesSearchModal = ({ movie, onClose }: { movie: Movie; onClose: () => void }) => {

    const { config } = usePageContext();

    const preferences = config?.preferences.subtitleLanguage || ["en"];

    const languageItems = useMemo<SelectItem[]>(() => {
        const languageItems: SelectItem[] = preferences
            .map((code) => {
                return {
                    value: LANGUAGE_OS_CODES[code] ?? code,
                    label: getLanguageName(code),
                };
            });
        return languageItems;
    }, [preferences]);

    const [selectedLanguage, setSelectedLanguage] = useState<string>(languageItems[0]?.value ?? "en");

    const { data: subtitlesResult, isLoading, error } = useSearchSubtitles(movie.id, selectedLanguage);

    const subtitles = useMemo(() => {
        return subtitlesResult?.data
            .filter((subtitle) => subtitle.attributes.nb_cd === 1)
            .sort((a, b) => {
                if (a.attributes.moviehash_match && !b.attributes.moviehash_match) return -1;
                if (!a.attributes.moviehash_match && b.attributes.moviehash_match) return 1;
                return b.attributes.download_count - a.attributes.download_count;
            }) ?? [];
    }, [subtitlesResult]);

    const [isDownloading, setIsDownloading] = useState(false);
    const [subtitleFile, setSubtitleFile] = useState<number | null>(null);

    const handleTestSubtitle = async (subtitleFileId: number) => {
        if (!movie) return;
        setSubtitleFile(subtitleFileId);
        setIsDownloading(true);
        const result = await window.electron.testSubtitle(movie.id, subtitleFileId);
        setIsDownloading(false);
        if (!result.success) {
            showToast({
                title: "Error testing subtitle",
                message: result.message,
                type: "error",
            });
        }
    }

    const { mutateAsync: saveSubtitleFile, isPending: isSaving } = usSaveSubtitleFile();

    const handleSaveSubtitleFile = async (subtitleFileId: number, subtitleFileName: string) => {
        if (!movie) return;
        setSubtitleFile(subtitleFileId);
        try {
            const result = await saveSubtitleFile({ movieId: movie.id, subtitleFileId, subtitleFileName });
            if (!result.success) {
                showToast({
                    title: "Error calculating hash",
                    message: result.message,
                    type: "error",
                });
            } else {
                showToast({
                    title: "Subtitle saved",
                    message: "The subtitle file has been saved successfully.",
                    type: "success",
                });
                onClose();
            }
        } catch (error) {
            showToast({
                title: "Action failed",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }


    };

    return (
        <DialogContent className="grid max-h-[88vh] w-[min(94vw,600px)] max-w-none grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/98 p-0 text-white shadow-2xl backdrop-blur-xl sm:max-w-none">
            <DialogHeader className="border-b border-white/8 px-6 py-5 pr-14">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45"><Subtitles size={15} /> Subtitle search</div>
                <DialogTitle className="text-xl font-light tracking-tight">Choose a subtitle</DialogTitle>
                <DialogDescription className="text-sm text-white/45">Available subtitle files for <span className="text-white/75">{movie.title}</span></DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-4 border-b border-white/8 px-6 py-3">
                <label className="flex min-w-0 items-center gap-3 text-xs text-white/45" htmlFor="subtitle-language">
                    <Languages size={15} className="shrink-0 text-cyan-100/55" />
                    <span className="shrink-0">Language</span>
                    <Select
                        value={selectedLanguage}
                        onValueChange={(value) => setSelectedLanguage(value ?? "en")}
                        items={languageItems}
                    >
                        <SelectTrigger className="h-9 min-w-40 rounded-lg border-white/10 bg-white/4 text-xs text-white/75">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="min-w-41">
                            {languageItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
                <span className="shrink-0 rounded-md border border-white/8 bg-white/4 px-2 py-1 text-[10px] tabular-nums text-white/40">{isLoading ? "Loading…" : `${subtitles.length} results`}</span>
            </div>

            <div className={`min-h-0 space-y-2 p-4 ${subtitles.length > 0 ? "soft-scrollbar overflow-y-auto" : ""}`}>
                {isLoading ? (
                    <div className="space-y-2">
                        <span className="sr-only">Loading subtitles…</span>
                        {Array.from({ length: 6 }, (_, index) => (
                            <article key={`subtitle-skeleton-${index}`} className="flex animate-pulse items-center gap-3 rounded-lg border border-white/[0.07] bg-white/2 px-3 py-2.5">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="h-3 w-3/4 rounded bg-white/10" />
                                    <div className="flex items-center gap-3">
                                        <div className="h-2.5 w-16 rounded bg-white/[0.07]" />
                                        <div className="h-2.5 w-24 rounded bg-white/[0.07]" />
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <div className="h-7 w-14 rounded-md border border-white/6 bg-white/4" />
                                    <div className="h-7 w-16 rounded-md border border-white/6 bg-white/4" />
                                </div>
                            </article>
                        ))}
                    </div>
                ) : subtitles.map((subtitle) =>
                    <article key={subtitle.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${subtitle.attributes.moviehash_match ? "border-cyan-200/25 bg-cyan-100/5.5" : "border-white/[0.07] bg-white/2"}`}>
                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="truncate text-xs font-medium leading-5 text-white/85">{subtitle.attributes.release}</div>
                                {subtitle.attributes.moviehash_match && <span className="inline-flex shrink-0 items-center gap-1 rounded border border-cyan-100/20 bg-cyan-100/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-cyan-100/75"><BadgeCheck size={11} /> Hash match</span>}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
                                <span className="flex items-center gap-1 font-medium text-white/60">
                                    <Languages size={11} className="text-white/35" />{OS_CODES_NAMES[subtitle.attributes.language] ?? getLanguageName(subtitle.attributes.language)}
                                </span>
                                <span className="px-0.5">·</span>
                                <span className="flex items-center gap-1 text-white/45">
                                    <Download size={11} className="text-white/35" />{subtitle.attributes.download_count.toLocaleString()} downloads
                                </span>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                                onClick={() => handleTestSubtitle(subtitle.attributes.files[0].file_id)}
                                type="button" variant="ghost" size="xs"
                                className="h-7 rounded-md border border-white/10 bg-white/2.5 px-2.5 text-[10px] text-cyan-50/90 hover:border-white/20 hover:bg-white/10 hover:text-white"
                            >
                                {subtitleFile == subtitle.attributes.files[0].file_id && isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Test
                            </Button>
                            <Button
                                onClick={() => handleSaveSubtitleFile(subtitle.attributes.files[0].file_id, subtitle.attributes.files[0].file_name)}
                                type="button" variant="ghost" size="xs"
                                className={`h-7 rounded-md border px-2.5 text-[10px] font-medium shadow-sm transition-colors border-cyan-200/25 bg-cyan-100/10 text-cyan-50/90 hover:border-cyan-200/40 hover:bg-cyan-100/20 hover:text-white}`}
                            >
                                {subtitleFile == subtitle.attributes.files[0].file_id && isSaving ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Save
                            </Button>
                        </div>
                    </article>

                )}
                {!isLoading && error &&
                    <div role="alert" className="flex w-full min-h-48 flex-col items-center justify-center rounded-xl border border-rose-200/10 bg-rose-200/3 text-center">
                        <Languages size={22} className="mb-3 text-rose-100/35" />
                        <p className="text-sm text-white/60">Subtitle search failed</p>
                        <p className="mt-1 max-w-sm px-4 text-xs text-white/35">{error instanceof Error ? error.message : "Please try again."}</p>
                    </div>
                }
                {!isLoading && !error && subtitles.length === 0 &&
                    <div className="flex w-full min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 text-center">
                        <Languages size={22} className="mb-3 text-white/25" />
                        <p className="text-sm text-white/55">No sample subtitles for {languageItems.find((item) => item.value === selectedLanguage)?.label}</p>
                        <p className="mt-1 text-xs text-white/30">Choose another preferred language to browse results.</p>
                    </div>
                }
            </div>

            <footer className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] text-white/35"><span className="size-1.5 rounded-full bg-cyan-200/70" />Showing subtitle matches by language</div>
            </footer>
        </DialogContent>
    );
};

export default SubtitlesSearchModal;
