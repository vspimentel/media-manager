export type MovieFolder = {
  path: string;
  name: string;
  videoFile: string;
  subtitlesFiles: string[];
  torrentFile: string | null;
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
  ohash: string;
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