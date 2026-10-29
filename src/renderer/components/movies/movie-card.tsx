import { Movie } from "../../types/movies"

const MovieCard = ({ movie }: { movie: Movie }) => {
    const posterFallback = "https://via.placeholder.com/300x450?text=No+Data";
    return (
        <div className="flex flex-col gap-2">
            <img
                src={movie.poster ? movie.poster : posterFallback}
                alt={movie.title}
                className="w-full aspect-2/3 rounded-xl border-white/50 shadow-2xl border object-fit"
            />
            <div className="flex flex-col gap-1">
                <div className="text-white text-sm font-light">{movie.title}</div>
                <div className="text-white text-xs font-thin">Duration: {movie.duration}</div>
            </div>
        </div>
    )
}

export default MovieCard