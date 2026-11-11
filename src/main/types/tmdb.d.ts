export type TMBDDetails = {
    id: number;
    title: string;
    runtime: number;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    release_date: string;
    original_title: string;
    tagline: string | null;
    vote_average: number;
    vote_count: number;
    origin_country: string[];
    original_language: string;
    genres: TMBDGenre[];
}

export type TMBDGenre = {
    id: number;
    name: string;
}

export type TMBDSearch = {
    results: TMBDResult[];
}

export type TMBDResult = {
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    overview: string;
    original_language: string;
}

export type TMBDMovieImages = {
    backdrops: TMBDImage[];
    logos: TMBDImage[];
    posters: TMBDImage[];
}

export type TMBDImage = {
    file_path: string;
    iso_639_1: string | null;
    width: number;
    height: number;
}