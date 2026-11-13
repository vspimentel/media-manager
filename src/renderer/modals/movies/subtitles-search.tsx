import { Dialog, DialogContent } from "#components/ui/dialog"
import { Subtitles } from "lucide-react"
import { Movie } from "../../types/movies"
import { Button } from "#components/ui/button"

const SubtitlesSearchModal = ({ movie }: { movie: Movie }) => {
    return (
        <Dialog>
            <DialogContent className="w-[min(92vw,560px)] gap-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/98 p-0 text-white">
                <div className="border-b border-white/10 px-6 py-5">
                    <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
                        <Subtitles size={15} />
                        Subtitle search
                    </div>
                    <h2 className="text-xl font-light">Find subtitles</h2>
                    <p className="mt-1 text-sm text-white/45">{movie.title} · Preview results</p>
                </div>
                <div className="soft-scrollbar max-h-[45vh] space-y-2 overflow-y-auto p-4">
                    {["Movie title match", "Release match", "Community upload"].map((match, index) =>
                        <div key={match} className="flex items-center gap-3 rounded-xl border border-white/7 bg-white/2.5 p-3">
                            <span className="text-[10px] text-emerald-200/65">{98 - index * 4}%</span>
                            <Button type="button" size="xs" variant="ghost" className="border border-white/10 text-white/55">Choose</Button>
                        </div>
                    )}
                </div>
                <div className="border-t border-white/8 px-5 py-3 text-center text-[10px] text-white/30">
                    Subtitle provider will be connected later
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SubtitlesSearchModal