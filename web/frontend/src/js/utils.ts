// Funciones de utilidad para el frontend

export const showMessage = (message: string, type: 'success' | 'danger' | 'warning' | 'info'): void => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            <button type="button" class="btn-close" aria-label="Close"></button>
            <svg class="bi" role="img" aria-label="${type}:">
                <use href="#${type}-icon" />
            </svg>
            <div>${message}</div>
        </div>`;

    const alertPlaceholder = document.querySelector("#alerts-container");
    if (alertPlaceholder) {
        alertPlaceholder.prepend(wrapper);

        setTimeout(() => wrapper.remove(), 5000);

        document.querySelectorAll(".btn-close").forEach(button => {
            button.addEventListener("click", () => {
                wrapper.remove();
            });
        });
    }
};

export const showAndHide = (
    obj: HTMLElement | null,
    visibility: 'visible' | 'hidden',
    zIndex?: number
): void => {
    if (!obj) return;

    if (visibility === 'visible') {
        obj.style.display = 'block';
        obj.style.visibility = 'visible';
    } else {
        obj.style.display = 'none';
        obj.style.visibility = 'hidden';
    }

    if (zIndex !== undefined) {
        obj.style.zIndex = zIndex.toString();
    }
};

// Líneas 37-40: Añadir validación
export const flagEmoji = (code: string): string => {
    if (!code || typeof code !== 'string') return '🏳️';
    return String.fromCodePoint(
        ...[...code.toUpperCase()].map(x => 0x1f1a5 + x.charCodeAt(0))
    );
};

export const getCsrfToken = (form: HTMLFormElement, tokenName: string = 'csrf_token_form'): string | null => {
    const input = form.querySelector(`input[name="${tokenName}"]`) as HTMLInputElement;
    return input?.value || null;
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// js/utils.ts - Corregir la función formatDuration

export const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Tipar explícitamente como array de strings
    const parts: string[] = [];

    if (days > 0) parts.push(`${days}Días`);
    if (hours > 0) parts.push(`${hours}hr`);
    if (minutes > 0) parts.push(`${minutes}min`);
    if (secs > 0) parts.push(`${secs}seg`);

    return parts.join(', ');
};
export const loadLocalData = <T>(key: string, defaultValue: T | null = null): T | null => {
    const data = localStorage.getItem(key);
    if (data) {
        try {
            return JSON.parse(data) as T;
        } catch {
            return defaultValue;
        }
    }
    return defaultValue;
};

export const saveLocalData = <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const debounce = <F extends (...args: any[]) => any>(
    func: F,
    wait: number
): ((...args: Parameters<F>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
