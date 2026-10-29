import { Clapperboard } from "lucide-react"

const PosterFallback = ({ iconSize }: { iconSize?: number }) => {
    return (
        <div className="relative h-full w-full shrink-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to- from-indigo-300/20 via-zinc-700 to-zinc-900 shadow-lg">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to- from-black/70 to-transparent" />
            <Clapperboard className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" size={iconSize ? iconSize : 18} />
        </div>
    )
}

export default PosterFallback