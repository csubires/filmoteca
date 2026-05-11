// Tipos de respuesta de la API
export interface ApiResponse<T = any> {
    message: string;
    data: T;
    status: number;
}

export interface Movie {
    id_movie: number;
    title: string;
    realtitle: string | null;
    year: number;
    quality: string | null;
    extension: string | null;
    size: number | null;
    size_str: string | null;
    duration: number | null;
    duration_str: string | null;
    pathfile: string;
    resolution: string | null;
    fps: number | null;
    urldesc: string | null;
    ratings: number | null;
    urlpicture: string | null;
    censure: number;
    file_created: string | null;
    report_date: string | null;
    id_genre: number;
    id_subgenre: number | null;
    id_country: number | null;
    hdd_code: number;
}

export interface MovieCard {
    id_movie: number;
    title: string;
    year: number;
    duration_str: string;
    ratings: number;
    urlpicture: string;
    id_genre: number;
    id_genre_path: number;
    genre_name?: string;
}

export interface ExtraInfoMovie {
    id_movie: number;
    realtitle: string;
    quality: string;
    extension: string;
    size_str: string;
    urldesc: string;
    urlpicture: string;
    id_genre: number;
    id_country: number;
    country: string;
    hdd_code: number;
    flag: string;
}

export interface SelectOption {
    id: number | string;
    name: string;
    value?: string;
}

// En js/types/api.types.ts, actualizar la interfaz Genre
export interface Genre {
    id_genre: number;
    name: string;
    num_movies: number;
    local_size?: number; // Añadir si existe
    local_size_str: string;
    local_duration?: number; // Añadir si existe
    local_duration_str: string;
    is_subgenre: number;
}

export interface User {
    email: string;
    role: string;
    auth: boolean;
}
