export const showMessage = (message, type) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            <button type="button" class="btn-close" aria-label="Close">×</button>
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
export const showAndHide = (obj, visibility, zIndex) => {
    if (!obj)
        return;
    if (visibility === 'visible') {
        obj.style.display = 'block';
        obj.style.visibility = 'visible';
    }
    else {
        obj.style.display = 'none';
        obj.style.visibility = 'hidden';
    }
    if (zIndex !== undefined) {
        obj.style.zIndex = zIndex.toString();
    }
};
export const flagEmoji = (code) => {
    if (!code || typeof code !== 'string')
        return '🇪🇸';
    const normalized = code.toLowerCase();
    const flags = {
        es: '🇪🇸',
        en: '🇺🇸',
        gb: '🇬🇧'
    };
    if (flags[normalized]) {
        return flags[normalized];
    }
    const letters = [...normalized.toUpperCase()].slice(0, 2);
    if (letters.length < 2 || letters.some(letter => letter < 'A' || letter > 'Z')) {
        return '🏳️';
    }
    return String.fromCodePoint(...letters.map(letter => 0x1f1e6 + letter.charCodeAt(0) - 65));
};
export const getFormToken = (form, tokenName = 'token') => {
    const input = form.querySelector(`input[name="${tokenName}"]`);
    return input?.value || null;
};
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
export const formatDuration = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (days > 0)
        parts.push(`${days}Días`);
    if (hours > 0)
        parts.push(`${hours}hr`);
    if (minutes > 0)
        parts.push(`${minutes}min`);
    if (secs > 0)
        parts.push(`${secs}seg`);
    return parts.join(', ');
};
export const loadLocalData = (key, defaultValue = null) => {
    const data = localStorage.getItem(key);
    if (data) {
        try {
            return JSON.parse(data);
        }
        catch {
            return defaultValue;
        }
    }
    return defaultValue;
};
export const saveLocalData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};
export const debounce = (func, wait) => {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
