export type OpenSubtitlesSearchResult = {
    "total_pages": number,
    "total_count": number,
    "page": number,
    "data": OpenSubtitlesSubtitle[]
}

export type OpenSubtitlesFile = {
    "file_id": number,
    "file_name": string
}

export type OpenSubtitlesSubtitle = {
    "id": string,
    "type": string,
    "attributes": {
        "language": string,
        "download_count": number,
        "upload_date": string,
        "nb_cd": number,
        "release": string,
        "moviehash_match": boolean,
        "files": OpenSubtitlesFile[]
    }
}


export type OpenSubtitlesDownloadResponse = {
    "link": string,
    "file_name": string,
    "remaining_downloads": number,
    "reset_time": string
}

export type SubtitleDownloadResult = {
    "filename": string | null,
    "reset": string | null,
}
