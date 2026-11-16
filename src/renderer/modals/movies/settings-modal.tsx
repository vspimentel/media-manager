import { Button } from "#components/ui/button";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "#components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "#components/ui/input-group";
import { useLetterboxdSession } from "#hooks/services/movies/useLetterboxdSession";
import { AudioLines, Check, Cookie, Folder, Link2, Plus, RefreshCw, Settings2, Subtitles, Video, X } from "lucide-react";
import type { ReactNode } from "react";

const SettingField = ({ label, icon, value, type = "text", action }: { label: string; icon: ReactNode; value: string; type?: string; action?: string }) => (
    <label className="block min-w-0 space-y-2">
        <span className="text-xs font-medium text-white/60">{label}</span>
        <InputGroup className="h-10 rounded-xl border-white/10 bg-white/4 shadow-none focus-within:border-cyan-100/25 focus-within:ring-0">
            <InputGroupAddon align="inline-start" className="pl-3 text-white/35">
                <InputGroupText>{icon}</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput type={type} placeholder={value} aria-label={label} className="min-w-0 text-xs text-white/75 placeholder:text-white/35" />
            {action && <InputGroupAddon align="inline-end" className="pr-1.5">
                <Button type="button" variant="ghost" size="xs" className="h-7 rounded-lg px-2 text-[11px] text-white/50 hover:bg-white/8 hover:text-white">{action}</Button>
            </InputGroupAddon>}
        </InputGroup>
    </label>
);

const LanguagePreference = ({ title, icon, values }: { title: string; icon: ReactNode; values: string[] }) => (
    <div className="rounded-xl border border-white/8 bg-white/2.5 p-3.5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/65">
            <span className="text-cyan-100/55">{icon}</span>{title}
            <span className="ml-auto rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5 text-[10px] tabular-nums text-white/35">{values.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
            {values.map((value) => (
                <span key={value} className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/8 bg-white/4 pl-2 text-[10px] font-medium uppercase tracking-wide text-white/60">
                    {value}
                    <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${value} language`} className="size-6 rounded-md text-white/30 hover:bg-white/8 hover:text-white/80">
                        <X size={11} />
                    </Button>
                </span>
            ))}
            <Button type="button" variant="ghost" className="h-7 gap-1 rounded-lg border border-dashed border-white/10 px-2 text-[10px] text-white/40 hover:border-white/20 hover:bg-white/5 hover:text-white/75">
                <Plus size={12} /> Add language
            </Button>
        </div>
    </div>
);

const SettingsModal = () => {

    const { username, isLoading, login, logout } = useLetterboxdSession();

    const handleLetterboxdLogin = async () => {
        if (!username && !isLoading) {
            await login.mutateAsync();
        } else if (username) {
            await logout.mutateAsync();
        }
    }

    return (
        <DialogContent className="max-h-[88vh] w-[min(94vw,680px)] max-w-none gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/98 p-0 text-white shadow-2xl backdrop-blur-xl sm:max-w-none">
            <DialogHeader className="border-b border-white/8 px-6 py-5 pr-14">
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl border border-cyan-100/15 bg-cyan-100/8 text-cyan-100/75"><Settings2 size={17} /></div>
                <DialogTitle className="text-lg font-medium tracking-tight">Basic options</DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-white/40">Manage your library sources, playback preferences, and connected services.</DialogDescription>
            </DialogHeader>

            <div className="soft-scrollbar max-h-[calc(88vh-148px)] space-y-6 overflow-y-auto px-6 py-5">
                <section aria-labelledby="settings-library-heading" className="space-y-3">
                    <div>
                        <h3 id="settings-library-heading" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Library & playback</h3>
                        <p className="mt-1 text-[11px] text-white/30">Paths and metadata services used by your collection.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <SettingField label="Movies folder" icon={<Folder size={14} />} value={"D:\\Movies"} action="Browse" />
                        <SettingField label="VLC application" icon={<Video size={14} />} value={"C:\\Program Files\\VideoLAN\\VLC\\vlc.exe"} action="Browse" />
                        <div className="sm:col-span-2"><SettingField label="TMDB API key" icon={<Link2 size={14} />} value="Configured API key" type="password" /></div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <LanguagePreference title="Preferred audio" icon={<AudioLines size={14} />} values={["Original", "EN"]} />
                        <LanguagePreference title="Preferred subtitles" icon={<Subtitles size={14} />} values={["ES", "LA", "EN"]} />
                    </div>
                </section>

                <section aria-labelledby="settings-integrations-heading" className="space-y-3">
                    <div>
                        <h3 id="settings-integrations-heading" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Integrations</h3>
                        <p className="mt-1 text-[11px] text-white/30">Connect services and keep your libraries in sync.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex min-h-32 flex-col rounded-xl border border-white/8 bg-white/2.5 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/65">
                                    <Cookie size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-white/80">Letterboxd</h4>
                                    <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                                        {username
                                            ? <>
                                                You're already signed in to Letterboxd as: <span className="font-medium text-white/80">{username}</span>
                                            </>
                                            : "Sign in to save your session cookies in the app's private browser partition"
                                        }
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleLetterboxdLogin}
                                type="button" variant="ghost" size="xs"
                                className="mt-2 h-8 w-full rounded-lg border border-white/10 bg-white/4 text-xs text-white/65 hover:bg-white/8 hover:text-white"
                            >
                                <Link2 size={13} /> {username ? "Log out from Letterboxd" : "Sign in to Letterboxd"}
                            </Button>
                        </div>
                        <div className="flex min-h-32 flex-col rounded-xl border border-white/8 bg-white/2.5 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-100/10 bg-cyan-100/5 text-cyan-100/60"><RefreshCw size={16} /></div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-white/80">Library sync</h4>
                                    <p className="mt-1 text-[11px] leading-relaxed text-white/35">Refresh movie files and metadata from your connected library folders.</p>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[10px] text-white/30">
                                    <Check size={12} className="shrink-0 text-emerald-200/55" /> Ready to sync
                                </span>
                                <Button
                                    type="button" variant="ghost" size="xs"
                                    className="h-8 rounded-lg border border-white/10 bg-white/4 px-2.5 text-xs text-white/65 hover:bg-white/8 hover:text-white"
                                >
                                    <RefreshCw size={13} /> Sync now
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </div >
        </DialogContent >
    );
}

export default SettingsModal;
