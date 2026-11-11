export type MovieFolder = {
  path: string;
  name: string;
  videoFile: string;
  subtitlesFile?: string;
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