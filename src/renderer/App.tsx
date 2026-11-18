import { DarkGradientBg } from "#components/ui/background";
import { Toaster } from "#components/ui/toast";
import { Routes, Route } from "react-router";
import MovieListPage from "./pages/movie-list";
import MovieDetailsPage from "./pages/movie-details";
import WindowTitlebar from "#components/layout/window-titlebar";
import { Dialog } from "#components/ui/dialog";
import { usePageContext } from "#hooks/common/usePageContext";
import MovieSettingsModal from "#components/modals/movies/movie-settings";

const App = () => {

    const { showMovieSettingsModal, setShowMovieSettingsModal } = usePageContext();

    return (
        <>
            <DarkGradientBg>
                <div className="flex h-screen flex-col overflow-hidden">
                    <WindowTitlebar />
                    <div className="min-h-0 flex-1">
                        <Routes>
                            <Route path="/" element={<MovieListPage />} />
                            <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
                        </Routes>
                    </div>
                </div>
                <Toaster />
                <Dialog open={showMovieSettingsModal} onOpenChange={setShowMovieSettingsModal}>
                    {showMovieSettingsModal && <MovieSettingsModal />}
                </Dialog>
            </DarkGradientBg>
        </>
    )
}

export default App;
