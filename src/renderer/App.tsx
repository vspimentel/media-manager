import MovieCard from "#components/movies/movie-card";
import { DarkGradientBg } from "#components/ui/background";
import { useMovies } from "#hooks/useMovies";

const App = () => {
    const { data: movies, isLoading, error } = useMovies();

    return (
        <>
            <DarkGradientBg>
                <div className="w-full h-screen p-5 flex gap-5">
                    <div className="w-2/10 h-full p-5 flex flex-col gap-3 bg-white/10 rounded-2xl shadow-2xl backdrop-blur-[2px] border border-white/10 before:content-[''] before:absolute before:insert-0 before:border before:border-white/20">
                        <div className="text-xl text-white font-light">All Movies</div>
                    </div>
                    <div className="w-8/10 h-full grid grid-cols-5 gap-5 overflow-y-scroll pr-5">
                        {movies?.map((movie) => {
                            console.log(movie)
                            return (
                                <MovieCard key={movie.title} movie={movie} />
                            )
                        })}
                    </div>
                </div>

            </DarkGradientBg>
        </>
    )
}

export default App;