
export type RatingRow = {
    Date: string;
    Name: string;
    Year: string;
    'Letterboxd URI': string;
    Rating: string
};

export type LetterboxdReview = {
    rating: number;
    review: string;
    liked: boolean;
    rewatch: boolean;
    containsSpoilers: boolean;
    addToDiary: boolean;
    watchedDate: string;
    tags: string;
};