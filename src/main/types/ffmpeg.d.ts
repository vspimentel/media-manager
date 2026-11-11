type ProbeStream = {
    codec_type: string;
    codec_name: string;
    width: number;
    height: number;
    tags: Record<string, string>;
};

export type ProbeData = {
    streams: ProbeStream[];
};