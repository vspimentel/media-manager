export type MovieFolder = {
  path: string;
  name: string;
  videoFile: string;
  subtitlesFiles: string[];
  torrentFiles: string[];
};

export type MovieImage = {
  file: string;
  language: string | null;
  width: number;
  height: number;
  type: "poster" | "backdrop" | "logo";
}

export type MovieResolution = {
  tag: string;
  width: number;
  height: number;
}

export type MovieMetadata = {
  filesize: number;
  ohash: string;
  resolution: MovieResolution;
  videoCodec?: string;
  audioCodecs: string[];
  audioLanguages: string[];
  subtitleLanguages: string[];
}
