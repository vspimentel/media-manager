export type Movie = {
  id: number;
  folder: string;
  videoFile: string;
  subtitleFiles: string | null;
  torrentFile: string | null;
  filesize: number;
  resolution: string | null;
  videoCodec: string | null;
  audioCodecs: string | null;
  audioLanguages: string | null;
  subtitleLanguages: string | null;
  selectedAudioLanguage: string;
  selectedSubtitleLanguage: string;
  ohash: string | null;
  rating: number | null;
  cacheKey: string | null;
  tmbdId: number | null;
  title: string | null;
  originalTitle: string | null;
  originalLanguage: string | null;
  tagline: string | null;
  overview: string | null;
  releaseDate: string | null;
  duration: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  poster: string | null;
  posterFilename: string | null;
  backdrop: string | null;
  backdropFilename: string | null;
  genres: string | null;
  countries: string | null;
};

export type Genre = {
  id: number;
  name: string;
}
