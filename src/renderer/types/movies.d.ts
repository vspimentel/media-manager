export type Movie = {
  id: number;
  folder: string;
  videoFile: string;
  subtitlesFile: string | null;
  filesize: number;
  resolution: string | null;
  videoCodec: string | null;
  audioCodecs: string | null;
  audioLanguages: string | null;
  subtitleLanguages: string | null;
  selectedAudioLanguage: string;
  selectedSubtitleLanguage: string;
  cacheKey: string | null;
  tmbdId: number;
  title: string;
  originalTitle: string | null;
  originalLanguage: string | null;
  tagline: string | null;
  overview: string | null;
  releaseDate: string | null;
  duration: string;
  voteAverage: number | null;
  voteCount: number | null;
  poster: string | null;
  genres: string | null;
  countries: string | null;
  backdrop: string | null;
};

export type Genre = {
  id: number;
  name: string;
}
