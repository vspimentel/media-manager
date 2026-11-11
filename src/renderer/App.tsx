import { DarkGradientBg } from "#components/ui/background";
import { Toaster } from "#components/ui/toast";
import { Routes, Route } from "react-router";
import MovieListPage from "./pages/movie-list";
import MovieDetailsPage from "./pages/movie-details";

const App = () => {
    return (
        <DarkGradientBg>
            <Routes>
                <Route path="/" element={<MovieListPage />} />
                <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
            </Routes>
            <Toaster />
        </DarkGradientBg>
    )
}

export default App;
