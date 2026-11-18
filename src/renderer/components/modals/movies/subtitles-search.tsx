import { Button } from "#components/ui/button";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "#components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#components/ui/select";
import { BadgeCheck, Check, Download, Languages, Play, Subtitles } from "lucide-react";
import langs from "langs";
import { useMemo, useState } from "react";
import { Movie } from "#types/movies";

type SubtitleResult = {
    id: string;
    title: string;
    language: string;
    downloads: number;
    hashMatch: boolean;
};

const subtitleResults: SubtitleResult[] = [
    { id: "7752038", title: "1080p Gojira Mainasu Wan Mainasu Karā (Godzilla Minus One - Minus Color) (2023)", language: "en", downloads: 10478, hashMatch: true },
    { id: "7752041", title: "1080p Gojira Mainasu Wan Mainasu Karā (Godzilla Minus One - Minus Color) (2023)", language: "es", downloads: 8264, hashMatch: true },
    { id: "7752046", title: "1080p Gojira Mainasu Wan Mainasu Karā (Godzilla Minus One - Minus Color) (2023)", language: "es", downloads: 5392, hashMatch: false },
    { id: "7752052", title: "Godzilla Minus One (2023) Latino", language: "es", downloads: 3120, hashMatch: false },
    { id: "7752053", title: "Godzilla.Minus.One.2023.1080p.WEB-DL.DDP5.1.H.264", language: "es", downloads: 2941, hashMatch: false },
    { id: "7752054", title: "Godzilla Minus One (2023) Spanish subtitles - BluRay", language: "es", downloads: 1876, hashMatch: false },
    { id: "7752055", title: "Godzilla Minus One 2023 HDRip castellano", language: "es", downloads: 1320, hashMatch: false },
    { id: "7752056", title: "Godzilla Minus One [2023] Spanish (Forced) [WEB]", language: "es", downloads: 864, hashMatch: false },
    { id: "7752058", title: "Godzilla Minus One (2023) Latinoamérica [WEB-DL]", language: "la", downloads: 2784, hashMatch: true },
    { id: "7752059", title: "Godzilla Minus One 2023 Latin Spanish", language: "la", downloads: 1561, hashMatch: false },
    { id: "7752061", title: "Godzilla.Minus.One.2023.2160p.UHD.BluRay.x265-LATAM", language: "la", downloads: 1403, hashMatch: false },
    { id: "7752062", title: "Godzilla Minus One - Latinoamericano (2023) WEBRip", language: "la", downloads: 987, hashMatch: false },
    { id: "7752063", title: "Godzilla Minus One 2023 Spanish Latin America [Full Subtitles]", language: "la", downloads: 643, hashMatch: false },
    { id: "7752065", title: "Godzilla Minus One (2023) LAT [BluRay 1080p]", language: "la", downloads: 422, hashMatch: false },
    { id: "7752060", title: "Gojira Mainasu Wan (2023) Japanese", language: "ja", downloads: 2487, hashMatch: false },
    { id: "7752064", title: "Godzilla Minus One (2023) [繁體中文]", language: "zh", downloads: 1843, hashMatch: false },
    { id: "7752071", title: "Godzilla Minus One (2023) [Português]", language: "pt", downloads: 1096, hashMatch: false },
    { id: "7752077", title: "Godzilla Minus One 2023 French", language: "fr", downloads: 742, hashMatch: false },
];

const SubtitlesSearchModal = ({ movie }: { movie: Movie }) => {

    const preferences = ["es", "la", "en"];
    const languageItems = useMemo<SelectItem[]>(() => {
        const languageItems: SelectItem[] = preferences.map((code) => {
            const language = langs.where("1", code);
            return {
                value: code,
                label: language ? language.name : code
            };
        });
        return languageItems;
    }, [preferences]);
    const [language, setLanguage] = useState(preferences[0] ?? "en");


    const languageName = (code: string) => {
        const language = langs.where("1", code);
        return language ? language.name : code;
    };

    const selectedSubtitle = subtitleResults.find((subtitle) => subtitle.language === language);

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
                        value={language}
                        onValueChange={(value) => setLanguage(value ?? "")}
                        items={languageItems}
                    >
                        <SelectTrigger id="subtitle-language" aria-label="Subtitle language" className="h-9 min-w-40 rounded-lg border-white/10 bg-white/4 text-xs text-white/75">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            {languageItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
                <span className="shrink-0 rounded-md border border-white/8 bg-white/4 px-2 py-1 text-[10px] tabular-nums text-white/40">{subtitleResults.length} results</span>
            </div>

            <div className="soft-scrollbar min-h-0 space-y-2 overflow-y-auto p-4 sm:p-5">
                {subtitleResults.map((subtitle) => {
                    const selected = selectedSubtitle?.id === subtitle.id;
                    return (
                        <article key={subtitle.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${subtitle.hashMatch ? "border-cyan-200/25 bg-cyan-100/5.5" : selected ? "border-white/20 bg-white/5" : "border-white/[0.07] bg-white/2 hover:border-white/15 hover:bg-white/4"}`}>
                            <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center gap-2">
                                    <div className="truncate text-xs font-medium leading-5 text-white/85">{subtitle.title}</div>
                                    {subtitle.hashMatch && <span className="inline-flex shrink-0 items-center gap-1 rounded border border-cyan-100/20 bg-cyan-100/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-cyan-100/75"><BadgeCheck size={11} /> Hash match</span>}
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
                                    <span className="flex items-center gap-1 font-medium text-white/60">
                                        <Languages size={11} className="text-white/35" />{languageName(subtitle.language)}
                                    </span>
                                    <span className="px-0.5">·</span>
                                    <span className="flex items-center gap-1 text-white/45">
                                        <Download size={11} className="text-white/35" />{subtitle.downloads.toLocaleString()} downloads
                                    </span>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <Button
                                    type="button" variant="ghost" size="xs"
                                    className="h-7 rounded-md border border-white/10 bg-white/2.5 px-2.5 text-[10px] text-white/55 hover:border-white/20 hover:bg-white/10 hover:text-white"
                                >
                                    <Play size={12} className="text-white/40" /> Test
                                </Button>
                                <Button
                                    type="button" variant="ghost" size="xs"
                                    className={`h-7 rounded-md border px-2.5 text-[10px] font-medium shadow-sm transition-colors ${selected ? "border-cyan-200/40 bg-cyan-200 text-zinc-950 hover:border-cyan-100/50 hover:bg-cyan-100 hover:text-zinc-950" : "border-cyan-200/25 bg-cyan-100/10 text-cyan-50/90 hover:border-cyan-200/40 hover:bg-cyan-100/20 hover:text-white"}`}
                                >
                                    {selected ? <><Check size={12} /> Select</> : <><Check size={12} /> Select</>}
                                </Button>
                            </div>
                        </article>
                    );
                })}
                {subtitleResults.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 text-center"><Languages size={22} className="mb-3 text-white/25" /><p className="text-sm text-white/55">No sample subtitles for {languageName(language)}</p><p className="mt-1 text-xs text-white/30">Choose another preferred language to browse results.</p></div>}
            </div>

            <footer className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-3">
                <div className="flex items-center gap-2 text-[11px] text-white/35"><span className="size-1.5 rounded-full bg-cyan-200/70" />Showing subtitle matches by language</div>
                <span className="truncate text-[10px] text-white/30">{selectedSubtitle ? `Selected: ${languageName(selectedSubtitle.language)}` : "Choose a subtitle to continue"}</span>
            </footer>
        </DialogContent>
    );
};

export type { SubtitleResult };
export default SubtitlesSearchModal;
