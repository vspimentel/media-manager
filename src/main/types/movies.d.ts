export type MovieFolder = {
  path: string;
  name: string;
  videoFile: string;
  subtitlesFiles: string[];
};

export type MovieImage = {
  file: string;
  language: string | null;
  width: number;
  height: number;
  type: "poster" | "backdrop" | "logo";
}

export type MovieMetadata = {
  filesize: number;
  resolution: {
    tag: string;
    width: number;
    height: number;
  };
  videoCodec?: string;
  audioCodecs: string[];
  audioLanguages: string[];
  subtitleLanguages: string[];
}

export type MovieLocalSubtitle = {
  file: string;
  language: string;
}