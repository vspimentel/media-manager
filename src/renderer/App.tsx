import MovieCard from "#components/movies/movie-card";
import { DarkGradientBg } from "#components/ui/background";
import { Dialog } from "#components/ui/dialog";
import { useMovies } from "#hooks/services/useMovies";
import MovieSelectionModal from "./modals/movies/movie-selection";
import { useState } from "react";
import { Movie } from "./types/movies";
import { Film, Search, SlidersHorizontal, Sparkles, Tv, Gamepad2, Images, Settings } from "lucide-react";
import { Toast } from "@base-ui/react";
import { Toaster } from "#components/ui/toast";

const App = () => {

    const { data: movies, isLoading, error } = useMovies();
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

    return (
        <>
            <DarkGradientBg>
                <div className="mx-auto flex h-screen w-full max-w-[1800px] gap-6 p-5 text-white md:p-7">
                    <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-white/8 bg-black/25 p-4 shadow-2xl backdrop-blur-xl lg:flex">
                        <div className="mb-9 flex items-center gap-3 px-2 pt-1">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100"><Film size={18} /></div>
                            <div><div className="text-sm font-medium tracking-wide">FRAME</div><div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Movie library</div></div>
                        </div>
                        <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">Your library</div>
                        <nav aria-label="Library sections" className="space-y-1">
                            <button type="button" aria-current="page" className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-left text-sm text-white/90"><Film size={16} className="text-cyan-100/80" /> Movies <span className="ml-auto text-xs text-white/40">{movies?.length ?? "—"}</span></button>
                            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 transition hover:bg-white/5 hover:text-white/80"><Tv size={16} className="text-white/40" /> TV shows</button>
                            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 transition hover:bg-white/5 hover:text-white/80"><Sparkles size={16} className="text-white/40" /> Anime</button>
                            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 transition hover:bg-white/5 hover:text-white/80"><Gamepad2 size={16} className="text-white/40" /> Games</button>
                            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 transition hover:bg-white/5 hover:text-white/80"><Images size={16} className="text-white/40" /> Galleries</button>
                        </nav>
                        <div className="mt-auto rounded-xl border border-white/8 bg-linear-to-br from-white/6 to-transparent p-3.5">
                            <div className="mb-2 flex items-center gap-2 text-xs text-white/70"><Sparkles size={14} className="text-cyan-100/70" /> Your collection</div>
                            <div className="text-xs leading-relaxed text-white/40">A quiet home for your favorite films.</div>
                            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-linear-to-r from-cyan-200/70 to-indigo-200/70" /></div>
                        </div>
                        <button type="button" className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/55 transition hover:bg-white/5 hover:text-white/85"><Settings size={16} className="text-white/45" /> Settings</button>
                    </aside>
                    <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/8 bg-black/15 shadow-2xl backdrop-blur-md">
                        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 px-5 py-5 md:px-7 md:py-6">
                            <div><div className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] text-cyan-100/55">Your collection</div><h1 className="text-2xl font-light tracking-tight md:text-3xl">All movies</h1><p className="mt-1.5 text-xs text-white/40">A little something for every night.</p></div>
                            <div className="flex items-center gap-2">
                                <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-white/4 px-3.5 text-sm text-white/35 sm:flex"><Search size={15} /><span>Search your library</span><span className="ml-8 rounded border border-white/10 px-1.5 py-0.5 text-[10px]">⌘ K</span></div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/50"><SlidersHorizontal size={16} /></div>
                            </div>
                        </header>
                        <div className="soft-scrollbar flex-1 overflow-y-auto p-5 md:p-7">
                            <div className="mb-5 flex items-center justify-between"><div className="text-xs text-white/45"><span className="text-white/80">{movies?.length ?? "—"}</span> titles</div><div className="text-[11px] text-white/30">Recently added <span className="ml-1">⌄</span></div></div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:gap-x-5 md:gap-y-8 xl:grid-cols-4 2xl:grid-cols-5">
                                {movies?.map((movie) => (
                                    <MovieCard
                                        key={movie.title}
                                        movie={movie}
                                        onChangeMovie={setSelectedMovie}
                                    />
                                ))}
                                {isLoading && Array.from({ length: 10 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-2/3 rounded-xl border border-white/6 bg-white/4.5" /><div className="mt-3 h-3 w-3/4 rounded bg-white/[0.07]" /><div className="mt-2 h-2.5 w-1/2 rounded bg-white/5" /></div>)}
                                {error && <div className="col-span-full rounded-xl border border-white/10 bg-white/4 p-6 text-sm text-white/50">Your movie collection could not be loaded.</div>}
                            </div>
                        </div>
                    </main>
                    <Dialog
                        open={selectedMovie !== null}
                        onOpenChange={(open) => { if (!open) setSelectedMovie(null); }}
                    >
                        {selectedMovie && (
                            <MovieSelectionModal
                                movieId={selectedMovie.id}
                                title={selectedMovie.folder}
                                onClose={() => setSelectedMovie(null)}
                            />
                        )}
                    </Dialog>
                </div>
                <Toaster />
            </DarkGradientBg>
        </>
    )
}

export default App;
