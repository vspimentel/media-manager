export type MovieFolder = {
  path: string;
  name: string;
  videoFile: string;
  subtitleFile?: string;
};

export type TMBDDetails = {
  id: number;
  title: string;
  runtime: number;
  poster_path: string;
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

export type MovieImage = {
  file: string;
  language: string | null;
  width: number;
  height: number;
  type: "poster" | "backdrop" | "logo";
} 
