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
