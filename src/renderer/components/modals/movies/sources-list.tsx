import { Button } from "#components/ui/button";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "#components/ui/dialog";
import { Input } from "#components/ui/input";
import { ArrowDownToLine, ExternalLink, FilePlus2, FileText, FolderOpen, Link2, Plus, Trash2 } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { DownloadSource } from "../../../../main/types/common";
import { useAddTorrentFile } from "#hooks/actions/sources/useAddTorrentFile";
import { showToast } from "#utils/common";
import { Movie } from "#types/movies";
import { useAddDownloadLink } from "#hooks/actions/sources/useAddDownloadLink";
import { useDeleteSource } from "#hooks/actions/sources/useDeleteSource";

const SourcesListModal = ({ movie }: { movie: Movie }) => {
    const sources = JSON.parse(movie.sources || "[]") as DownloadSource[];

    const torrentInputRef = useRef<HTMLInputElement>(null);
    const addTorrentFile = useAddTorrentFile();

    const handleAddTorrentFile = async (file: File) => {
        if (!movie) return;
        try {
            const result = await addTorrentFile.mutateAsync({ movieId: movie.id, folder: movie.folder, torrentFile: file });
            showToast({
                title: "Torrent file added",
                message: result.message,
                type: result.success ? "success" : "error",
            });

        } catch (error) {
            showToast({
                title: "Torrent file not added",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    };

    const [newLink, setNewLink] = useState("");
    const [showLinkInput, setShowLinkInput] = useState(false);

    const handleOpenLinkInput = () => {
        setShowLinkInput(true);
    };

    const addDownloadLink = useAddDownloadLink();

    const handleAddDownloadLink = async (link: string) => {
        if (!movie) return;
        if (!link.trim()) return;
        try {
            const result = await addDownloadLink.mutateAsync({ movieId: movie.id, link });
            showToast({
                title: "Download link added",
                message: result.message,
                type: result.success ? "success" : "error",
            });
            setShowLinkInput(false);
            setNewLink("");
        } catch (error) {
            showToast({
                title: "Download link not added",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    };

    const handleOpenSource = async (source: DownloadSource) => {
        if (!movie) return;
        if (source.type === "link") {
            const result = await window.electron.openExternalLink(source.source);
            if (!result.success) showToast({
                title: "Error opening link",
                message: result.message,
                type: "error",
            });
        } else if (source.type === "torrent") {
            const file = source.source;
            const result = await window.electron.openLocalFile("movies", movie.folder, file);
            if (!result.success) showToast({
                title: "Error opening file",
                message: result.message,
                type: "error",
            });
        }
    };

    const deleteSource = useDeleteSource();

    const handleDeleteSource = async (source: DownloadSource) => {
        if (!movie) return;
        try {
            const result = await deleteSource.mutateAsync({ movieId: movie.id, sourceType: source.type, sourceValue: source.source });
            showToast({
                title: "Source deleted",
                message: result.message,
                type: result.success ? "success" : "error",
            });
        } catch (error) {
            showToast({
                title: "Source not deleted",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: "error",
            });
        }
    };

    return (
        <DialogContent className="grid max-h-[88vh] w-[min(94vw,620px)] max-w-none grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/98 p-0 text-white shadow-2xl backdrop-blur-xl sm:max-w-none">
            <DialogHeader className="border-b border-white/8 px-6 py-5 pr-14">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                    <ArrowDownToLine size={15} /> Download sources
                </div>
                <DialogTitle className="text-xl font-light tracking-tight">Sources list</DialogTitle>
                <DialogDescription className="text-sm text-white/45">
                    Manage download links and torrent files for <span className="text-white/75">{movie.title}</span>
                </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-3 border-b border-white/8 px-6 py-3">
                <span className="text-xs text-white/45">{sources.length} sources</span>
                <div className="flex gap-2">
                    <Button
                        type="button" variant="ghost" size="xs"
                        onClick={handleOpenLinkInput}
                        className="h-8 rounded-lg border border-white/10 bg-white/4 px-2.5 text-[11px] text-white/65 hover:bg-white/10 hover:text-white"
                    >
                        <Link2 size={13} /> Add link
                    </Button>
                    <input
                        ref={torrentInputRef}
                        type="file"
                        accept=".torrent"
                        className="hidden"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            const file = event.target.files?.[0];
                            if (file) handleAddTorrentFile(file);
                        }}
                    />
                    <Button
                        type="button" variant="ghost" size="xs"
                        onClick={() => torrentInputRef.current?.click()}
                        className="h-8 rounded-lg border border-white/10 bg-white/4 px-2.5 text-[11px] text-white/65 hover:bg-white/10 hover:text-white"
                    >
                        <FilePlus2 size={13} /> Add torrent
                    </Button>
                </div>
            </div>

            <div className={`min-h-65 space-y-2 p-4 ${sources.length === 0 ? "" : "soft-scrollbar overflow-y-auto"}`}>
                {showLinkInput && (
                    <div className="flex gap-2 rounded-xl border border-cyan-100/15 bg-cyan-100/[0.035] p-3">
                        <Input
                            autoFocus value={newLink}
                            onChange={(event) => setNewLink(event.target.value)}
                            placeholder="Paste a download link here"
                            className="h-9 border-white/10 bg-black/20 text-xs text-white placeholder:text-white/30"
                        />
                        <Button
                            type="button" size="sm" onClick={() => {
                                handleAddDownloadLink(newLink);
                            }}
                            className="h-9 rounded-lg bg-cyan-100 px-3 text-xs text-zinc-950 hover:bg-cyan-50"
                        >
                            <Plus size={14} /> Add
                        </Button>
                    </div>
                )}
                {sources.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/2 px-6 text-center">
                        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-white/35">
                            <FolderOpen size={19} />
                        </div>
                        <p className="text-sm font-medium text-white/65">No sources added</p>
                        <p className="mt-1 max-w-64 text-xs leading-relaxed text-white/35">
                            Add a download link or a torrent file to see it listed here.
                        </p>
                    </div>
                )}
                {sources.map((source, index) => {
                    const isLink = source.type === "link";
                    return (
                        <article key={index} className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${isLink ? "border-cyan-100/12 bg-cyan-100/2.5" : "border-white/[0.07] bg-white/2"}`}>
                            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${isLink ? "border-cyan-100/15 bg-cyan-100/[0.07] text-cyan-100/65" : "border-violet-100/10 bg-violet-100/5 text-violet-100/55"}`}>
                                {isLink ? <Link2 size={15} /> : <FileText size={15} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-medium text-white/80">{source.source}</div>
                                <div className={`mt-1 text-[10px] font-medium uppercase tracking-wide ${isLink ? "text-cyan-100/50" : "text-violet-100/45"}`}>
                                    {isLink ? "Download link" : "Torrent file"}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    type="button" variant="ghost" size="icon-xs"
                                    onClick={() => handleOpenSource(source)}
                                    className="size-7 rounded-md text-white/45 hover:bg-white/10 hover:text-white"
                                >
                                    <ExternalLink size={13} />
                                </Button>
                                <Button
                                    type="button" variant="ghost" size="icon-xs"
                                    onClick={() => handleDeleteSource(source)}
                                    className="size-7 rounded-md text-white/35 hover:bg-rose-300/10 hover:text-rose-100"
                                >
                                    <Trash2 size={13} />
                                </Button>
                            </div>
                        </article>
                    );
                })}
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3 text-[10px] text-white/35">
                <span>Links and files are preview data</span>
                <span className="truncate">{movie.folder}</span>
            </footer>
        </DialogContent>
    );
};

export default SourcesListModal;
