export interface TorrentTaskStatus {
    task_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'not_found';
    progress?: number;
    message?: string;
    type?: string;
    data?: any;
    error?: string;
}

export interface TorrentStartResponse {
    taskId: string;
    status: number;
}

export interface TorrentStopResponse {
    success: boolean;
    message: string;
    status: number;
}

export interface TorrentMovie {
    index: number;
    title: string;
    year: string;
    rating: number;
    url_imbd: string;
    url_rojo: string;
    url_filma: string;
}

export interface TorrentSerie {
    index: number;
    title: string;
    chapters: number;
    url_rojo: string;
    url_filma: string;
}

export interface TorrentConfig {
    url_end: string;
    date_end: string;
    npseries: number;
}
