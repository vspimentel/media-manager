export type TMBDDetails = {
  title: string;
  runtime: number;
  poster_path: string;
}

export type TMBDSearch = {
  results: TMBDResult[];
}

export type TMBDResult = {
  id: number;
}

export type Movie = {
  title: string;
  duration: string;
  poster: string;
};
