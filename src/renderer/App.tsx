import { DarkGradientBg } from "#components/ui/background";
import { Toaster } from "#components/ui/toast";
import { Routes, Route } from "react-router";
import MovieListPage from "./pages/movie-list";

const App = () => {
    return (
        <DarkGradientBg>
            <Routes>
                <Route path="/" element={<MovieListPage />} />
            </Routes>
            <Toaster />
        </DarkGradientBg>
    )
}

export default App;
