import { Router } from './core/router.js';
import { connection } from './core/connection.js';
import { AuthService } from './services/auth.service.js';
import { MovieService } from './services/MovieService.js';
import { flagEmoji } from './utils.js';
export const auth = new AuthService(connection);
const movieService = new MovieService();
const routes = {
    '/': () => import('./views/HomeView.js'),
    '/view/:id': () => import('./views/ViewView.js'),
    '/view': () => import('./views/ViewView.js'),
    '/login': () => import('./views/LoginView.js'),
    '/signup': () => import('./views/SignupView.js'),
    '/reset': () => import('./views/ResetView.js'),
    '/menu/genres': () => import('./views/GenresView.js'),
    '/menu/genres/:id': () => import('./views/GenresView.js'),
    '/menu/statistics': () => import('./views/StatisticsView.js'),
    '/menu/inventories': () => import('./views/InventoriesView.js'),
    '/menu/inventories/:year': () => import('./views/InventoriesView.js'),
    '/menu/tasks': () => import('./views/TorrentView.js'),
    '/menu/search': () => import('./views/SearchView.js'),
    '/auth/search': () => import('./views/SearchView.js'),
    '/maintenance/:section': () => import('./views/MaintenanceView.js')
};
const router = new Router(routes);
let genresLoaded = false;
let searchDebounceTimer = null;
let searchSuggestionRequest = 0;
let searchListenersReady = false;
let themeLanguageListenersReady = false;
let cardInfoListenerReady = false;
let availableLanguages = [];
let translationCatalog = {};
let translationLookup = {};
let translationCatalogLoaded = false;
let translationCatalogPromise = null;
let translationAnnotationDone = false;
function initializeLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'es';
    const normalizedLanguage = savedLanguage === 'en' ? 'en' : 'es';
    document.documentElement.lang = normalizedLanguage;
}
document.addEventListener('DOMContentLoaded', () => {
    initializeLanguage();
    auth.ready.finally(() => {
        router.handleRoute();
    });
    setupMenuClickToggle();
    setupCardInfoPositioning();
    setupGlobalSearch();
    setupThemeLanguageToggles();
});
window.addEventListener('navigation-complete', async () => {
    await loadNavigation();
    if (!genresLoaded) {
        await loadGenres();
    }
    const currentLanguage = getCurrentLanguage();
    await syncLanguageToggle(currentLanguage);
    await applyTranslations(currentLanguage);
    syncThemeToggle();
    setupCardInfoPositioning();
});
window.addEventListener('i18n-content-changed', () => {
    void applyTranslations(getCurrentLanguage(), true);
});
function setupMenuClickToggle() {
    document.addEventListener('click', (e) => {
        const target = e.target;
        const clickedIcon = target.closest('.menu > i');
        const clickedMenu = target.closest('.menu');
        if (clickedIcon && clickedMenu) {
            e.stopPropagation();
            const isOpen = clickedMenu.classList.contains('open');
            document.querySelectorAll('.menu.open').forEach(m => m.classList.remove('open'));
            if (!isOpen) {
                clickedMenu.classList.add('open');
            }
            return;
        }
        if (!target.closest('.container-left') && !target.closest('.container-right') && !target.closest('.container-bottom')) {
            document.querySelectorAll('.menu.open').forEach(m => m.classList.remove('open'));
        }
    });
}
function setupCardInfoPositioning() {
    if (cardInfoListenerReady)
        return;
    cardInfoListenerReady = true;
    document.addEventListener('card-info-shown', ((e) => {
        const { movieId, x, y } = e.detail;
        const infoPanel = document.getElementById(`info-${movieId}`);
        const trigger = document.querySelector(`[data-action="show-info"][data-id="${movieId}"]`);
        if (infoPanel && trigger) {
            positionInfoPanel(infoPanel, trigger, x, y);
        }
    }));
}
function setupThemeLanguageToggles() {
    if (themeLanguageListenersReady)
        return;
    themeLanguageListenersReady = true;
    document.addEventListener('click', async (e) => {
        const target = e.target;
        const themeButton = target.closest('[data-action="toggle-theme"]');
        const languageButton = target.closest('[data-action="toggle-language"]');
        if (themeButton) {
            e.preventDefault();
            const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
            localStorage.setItem('theme', nextTheme);
            syncThemeToggle(nextTheme);
            return;
        }
        if (languageButton) {
            e.preventDefault();
            const nextLanguage = getNextLanguage();
            await changeLanguage(nextLanguage);
        }
    });
}
async function changeLanguage(language) {
    try {
        const response = await fetch('/api/i18n/change-language', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ language })
        });
        if (!response.ok) {
            throw new Error('No se pudo cambiar el idioma');
        }
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
        await router.handleRoute();
        await loadNavigation();
        await syncLanguageToggle(language);
        await applyTranslations(language);
    }
    catch (error) {
        console.error('Error changing language:', error);
    }
}
async function loadTranslationCatalog() {
    if (translationCatalogLoaded)
        return;
    if (translationCatalogPromise)
        return translationCatalogPromise;
    translationCatalogPromise = (async () => {
        const [esResponse, enResponse] = await Promise.all([
            fetch('/api/i18n/locales/es.json'),
            fetch('/api/i18n/locales/en.json')
        ]);
        if (!esResponse.ok || !enResponse.ok) {
            return;
        }
        const [esCatalog, enCatalog] = await Promise.all([
            esResponse.json(),
            enResponse.json()
        ]);
        translationCatalog = {
            es: flattenTranslations(esCatalog),
            en: flattenTranslations(enCatalog)
        };
        buildTranslationLookup();
        translationCatalogLoaded = true;
    })();
    try {
        await translationCatalogPromise;
    }
    finally {
        translationCatalogPromise = null;
    }
}
function flattenTranslations(payload, prefix = '') {
    const result = {};
    Object.entries(payload || {}).forEach(([key, value]) => {
        const nextKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(result, flattenTranslations(value, nextKey));
            return;
        }
        if (typeof value === 'string') {
            result[nextKey] = value;
        }
    });
    return result;
}
function buildTranslationLookup() {
    const lookup = {};
    const spanishCatalog = translationCatalog.es || {};
    Object.entries(spanishCatalog).forEach(([key, value]) => {
        const normalized = normalizeTranslationText(value);
        if (normalized && !lookup[normalized]) {
            lookup[normalized] = key;
        }
    });
    translationLookup = lookup;
}
function normalizeTranslationText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}
function parseI18nAttrMappings(rawValue) {
    return rawValue
        .split(/[;,]/)
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => {
        const [attr, key] = item.split(':').map(part => part.trim());
        return attr && key ? { attr, key } : null;
    })
        .filter((item) => Boolean(item));
}
function mergeI18nAttrMappings(currentValue, additions) {
    const existing = parseI18nAttrMappings(currentValue);
    const map = new Map();
    existing.forEach(item => map.set(item.attr, item.key));
    additions.forEach(item => map.set(item.attr, item.key));
    return Array.from(map.entries()).map(([attr, key]) => `${attr}:${key}`).join(';');
}
function annotateI18n(root) {
    if (!translationCatalogLoaded)
        return;
    const elements = [];
    if (root instanceof Element) {
        elements.push(root);
    }
    root.querySelectorAll('*').forEach(element => elements.push(element));
    elements.forEach(element => {
        if (!element.dataset.i18n) {
            const text = normalizeTranslationText(element.textContent || '');
            if (text && element.children.length === 0) {
                const key = translationLookup[text];
                if (key) {
                    element.dataset.i18n = key;
                }
            }
        }
        const mappedAttrs = [];
        ['title', 'aria-label', 'placeholder', 'value'].forEach(attr => {
            const current = element.getAttribute(attr);
            if (!current)
                return;
            const key = translationLookup[normalizeTranslationText(current)];
            if (key) {
                mappedAttrs.push({ attr, key });
            }
        });
        if (mappedAttrs.length > 0) {
            element.dataset.i18nAttr = mergeI18nAttrMappings(element.dataset.i18nAttr || '', mappedAttrs);
        }
    });
}
function translateAnnotatedElement(element, language) {
    const normalizedLanguage = language === 'en' ? 'en' : 'es';
    const translatedText = element.dataset.i18n ? translationCatalog[normalizedLanguage]?.[element.dataset.i18n] : undefined;
    if (translatedText) {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            const inputType = element instanceof HTMLInputElement ? element.type : '';
            if (inputType === 'button' || inputType === 'submit' || inputType === 'reset') {
                element.value = translatedText;
            }
            else if (element.hasAttribute('placeholder')) {
                element.placeholder = translatedText;
            }
            else {
                element.value = translatedText;
            }
        }
        else {
            element.textContent = translatedText;
        }
    }
    const mappings = parseI18nAttrMappings(element.dataset.i18nAttr || '');
    mappings.forEach(({ attr, key }) => {
        const attrTranslation = translationCatalog[normalizedLanguage]?.[key];
        if (attrTranslation) {
            element.setAttribute(attr, attrTranslation);
        }
    });
}
function getTranslationMaps(language) {
    const normalizedLanguage = language === 'en' ? 'en' : 'es';
    const target = translationCatalog[normalizedLanguage] || {};
    const source = translationCatalog[normalizedLanguage === 'en' ? 'es' : 'en'] || {};
    return { source, target };
}
function translateNodeText(text, sourceMap, targetMap) {
    const trimmed = text.trim();
    const translated = targetMap[sourceMap[trimmed] ? trimmed : text] || targetMap[trimmed] || targetMap[sourceMap[trimmed] || ''];
    if (!translated) {
        return text;
    }
    return text.replace(trimmed, translated);
}
function translateDomAttributes(root, sourceMap, targetMap) {
    const elements = root.querySelectorAll('*');
    elements.forEach(element => {
        ['placeholder', 'title', 'aria-label', 'value'].forEach(attribute => {
            const current = element.getAttribute(attribute);
            if (!current)
                return;
            const trimmed = current.trim();
            const translated = targetMap[sourceMap[trimmed] ? trimmed : current] || targetMap[trimmed];
            if (translated) {
                element.setAttribute(attribute, translated);
            }
        });
    });
}
function translateDomText(root, sourceMap, targetMap) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
    const nodes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || skipTags.has(parent.tagName))
            continue;
        if (!node.nodeValue || !node.nodeValue.trim())
            continue;
        nodes.push(node);
    }
    nodes.forEach(node => {
        const current = node.nodeValue || '';
        const trimmed = current.trim();
        const translated = targetMap[sourceMap[trimmed] ? trimmed : current] || targetMap[trimmed];
        if (!translated)
            return;
        node.nodeValue = current.replace(trimmed, translated);
    });
}
async function applyTranslations(language, forceAnnotate = false) {
    await loadTranslationCatalog();
    if (!translationCatalogLoaded)
        return;
    const normalizedLanguage = language === 'en' ? 'en' : 'es';
    if (!translationAnnotationDone || forceAnnotate) {
        annotateI18n(document.body);
        translationAnnotationDone = true;
    }
    document.querySelectorAll('[data-i18n], [data-i18n-attr]').forEach(element => {
        translateAnnotatedElement(element, normalizedLanguage);
    });
    const { source, target } = getTranslationMaps(normalizedLanguage);
    translateDomText(document.body, source, target);
    translateDomAttributes(document.body, source, target);
    const button = document.querySelector('[data-action="toggle-language"]');
    if (button) {
        const nextLanguage = normalizedLanguage === 'es' ? 'en' : 'es';
        button.textContent = flagEmoji(nextLanguage);
    }
}
function getCurrentLanguage() {
    return document.documentElement.lang || localStorage.getItem('language') || 'es';
}
function getNextLanguage() {
    const currentLanguage = getCurrentLanguage();
    const languages = availableLanguages.map(language => language.code).filter(Boolean);
    if (languages.length >= 2) {
        return languages.find(language => language !== currentLanguage) || languages[0];
    }
    return currentLanguage === 'es' ? 'en' : 'es';
}
function syncThemeToggle(theme = (document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark')) {
    const button = document.querySelector('[data-action="toggle-theme"]');
    if (!button)
        return;
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const currentLanguage = getCurrentLanguage() === 'en' ? 'en' : 'es';
    const titleKey = nextTheme === 'light' ? 'theme.toggle_to_light' : 'theme.toggle_to_dark';
    const title = translationCatalog[currentLanguage]?.[titleKey] || (nextTheme === 'light' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    button.textContent = theme === 'dark' ? '☀' : '☾';
    button.title = title;
    button.setAttribute('aria-label', button.title);
    button.dataset.i18nAttr = mergeI18nAttrMappings(button.dataset.i18nAttr || '', [
        { attr: 'title', key: titleKey },
        { attr: 'aria-label', key: titleKey }
    ]);
}
async function syncLanguageToggle(language) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch('/api/i18n/available-languages', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.warn('Failed to fetch available languages:', response.status);
            updateLanguageToggleUI(language || getCurrentLanguage());
            return;
        }
        const data = await response.json();
        const languages = Array.isArray(data?.languages) ? data.languages : [];
        availableLanguages = languages;
        const currentLanguage = language || data?.current || getCurrentLanguage() || 'es';
        const normalizedLanguage = currentLanguage === 'en' ? 'en' : 'es';
        updateLanguageToggleUI(normalizedLanguage, languages);
        document.documentElement.lang = normalizedLanguage;
        localStorage.setItem('language', normalizedLanguage);
    }
    catch (error) {
        console.warn('Error syncing language selector:', error);
        updateLanguageToggleUI(language || getCurrentLanguage());
    }
}
function updateLanguageToggleUI(normalizedLanguage, languages = []) {
    const button = document.querySelector('[data-action="toggle-language"]');
    if (button) {
        const nextLanguage = normalizedLanguage === 'es' ? 'en' : 'es';
        const languageMeta = languages.find(item => item.code === nextLanguage) || languages.find(item => item.code === normalizedLanguage);
        const titleKey = nextLanguage === 'es' ? 'language.toggle_to_es' : 'language.toggle_to_en';
        const title = translationCatalog[normalizedLanguage]?.[titleKey] || `Cambiar a ${nextLanguage === 'es' ? 'Español' : 'English'}`;
        button.textContent = flagEmoji(nextLanguage);
        button.title = languageMeta?.name && !translationCatalog[normalizedLanguage]?.[titleKey]
            ? `Cambiar a ${languageMeta.name}`
            : title;
        button.setAttribute('aria-label', button.title);
        button.dataset.i18nAttr = mergeI18nAttrMappings(button.dataset.i18nAttr || '', [
            { attr: 'title', key: titleKey },
            { attr: 'aria-label', key: titleKey }
        ]);
    }
}
function setupGlobalSearch() {
    if (searchListenersReady)
        return;
    const form = document.getElementById('form-search');
    const input = document.getElementById('text-search');
    const clearButton = document.getElementById('clear-search');
    const datalist = document.getElementById('dlSearch');
    if (!form || !input || !datalist)
        return;
    searchListenersReady = true;
    const clearSuggestions = () => {
        datalist.innerHTML = '';
    };
    const renderSuggestions = (movies) => {
        clearSuggestions();
        movies.forEach(movie => {
            const option = document.createElement('option');
            option.value = movie.title;
            option.label = String(movie.year);
            datalist.appendChild(option);
        });
    };
    const fetchSuggestions = async (query) => {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length < 2) {
            clearSuggestions();
            return;
        }
        const requestId = ++searchSuggestionRequest;
        try {
            const movies = await movieService.search(normalizedQuery, 8);
            if (requestId !== searchSuggestionRequest)
                return;
            renderSuggestions(movies || []);
        }
        catch (error) {
            if (requestId === searchSuggestionRequest) {
                clearSuggestions();
            }
        }
    };
    const navigateToSearch = (query) => {
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            router.navigate('/view/0');
            return;
        }
        router.navigate(`/view?search=${encodeURIComponent(normalizedQuery)}`);
    };
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        navigateToSearch(input.value);
    });
    input.addEventListener('input', () => {
        const value = input.value;
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        void fetchSuggestions(value);
        searchDebounceTimer = window.setTimeout(() => {
            navigateToSearch(value);
        }, 300);
    });
    clearButton?.addEventListener('click', (e) => {
        e.preventDefault();
        searchSuggestionRequest += 1;
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        input.value = '';
        clearSuggestions();
        router.navigate('/view/0');
        input.focus();
    });
}
function positionInfoPanel(panel, trigger, cursorX, cursorY) {
    const cardRect = trigger.closest('.card-film')?.getBoundingClientRect();
    if (!cardRect)
        return;
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width || 280;
    const panelHeight = panelRect.height || 320;
    const margin = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = cardRect.right + margin;
    let top = cardRect.top;
    const hasCursor = Number.isFinite(cursorX) && Number.isFinite(cursorY);
    if (hasCursor) {
        const safeCursorX = cursorX;
        const safeCursorY = cursorY;
        left = safeCursorX + margin;
        top = safeCursorY - panelHeight / 2;
    }
    if (left + panelWidth > viewportWidth - margin) {
        left = hasCursor
            ? cursorX - panelWidth - margin
            : cardRect.left - panelWidth - margin;
    }
    if (left < margin) {
        left = Math.max(margin, cardRect.left + (cardRect.width - panelWidth) / 2);
    }
    if (top + panelHeight > viewportHeight - margin) {
        top = viewportHeight - panelHeight - margin;
    }
    if (top < margin) {
        top = margin;
    }
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
}
async function loadNavigation() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu)
        return;
    const isAuth = auth.isAuthenticated();
    const user = auth.getUser();
    const currentPath = window.location.pathname;
    const isActive = (href) => href === '/'
        ? currentPath === '/'
        : currentPath.startsWith(href);
    let menuHtml = '';
    if (isAuth) {
        menuHtml = `
            <a href="/" ${isActive('/') ? 'class="active"' : ''}>Inicio</a>
            <a href="/view/0" ${isActive('/view') ? 'class="active"' : ''}>Recientes</a>
            <a href="/menu/statistics" ${isActive('/menu/statistics') ? 'class="active"' : ''}>Estadísticas</a>
            <a href="/menu/inventories" ${isActive('/menu/inventories') ? 'class="active"' : ''}>Listados</a>
            <a href="/menu/tasks" ${isActive('/menu/tasks') ? 'class="active"' : ''}>Tareas</a>
            <a href="/menu/search" ${isActive('/menu/search') || isActive('/auth/search') ? 'class="active"' : ''}>Búsqueda Avanzada</a>
            <a href="/maintenance/general" ${isActive('/maintenance') ? 'class="active"' : ''}>Mantenimiento</a>
            <a href="#" id="logout-btn">Salir</a>
        `;
    }
    else {
        menuHtml = `
            <a class="mark-opt" href="/login" ${isActive('/login') ? 'class="active"' : ''}>Iniciar Sesión</a>
            <a href="/view/0" ${isActive('/view') ? 'class="active"' : ''}>Recientes</a>
            <a href="/menu/inventories" ${isActive('/menu/inventories') ? 'class="active"' : ''}>Listados</a>
            <a href="/menu/tasks" ${isActive('/menu/tasks') ? 'class="active"' : ''}>Tareas</a>
        `;
    }
    menuHtml += `
        <div class="theme-toggle">
            <button class="btn-theme" data-action="toggle-theme" type="button" title="Cambiar modo"></button>
            <button class="btn-theme btn-language" data-action="toggle-language" type="button" title="Cambiar idioma"></button>
        </div>
    `;
    navMenu.innerHTML = menuHtml;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    syncThemeToggle(savedTheme);
    void syncLanguageToggle();
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}
async function loadGenres() {
    const genreMenu = document.getElementById('genre-menu');
    if (!genreMenu)
        return;
    try {
        const response = await fetch('/api/get_all_genres');
        const json = await response.json();
        const genres = json?.data || [];
        const isGenresPage = window.location.pathname.startsWith('/menu/genres');
        const genreHomeClass = isGenresPage ? 'genre-home active' : 'genre-home';
        if (Array.isArray(genres) && genres.length > 0) {
            genreMenu.innerHTML = [`
                <a href="/menu/genres" class="${genreHomeClass}">Géneros</a>
            `, ...genres
                    .map((g) => `<a href="/menu/genres/${g.id_genre}" ${window.location.pathname === `/menu/genres/${g.id_genre}` ? 'class="active"' : ''}>${g.name}</a>`)].join('');
            genresLoaded = true;
        }
        else {
            genreMenu.innerHTML = `<a href="/menu/genres" class="${genreHomeClass}">Géneros</a>`;
        }
    }
    catch (error) {
        console.error('Error loading genres:', error);
        genreMenu.innerHTML = `<a href="/menu/genres" class="${window.location.pathname.startsWith('/menu/genres') ? 'genre-home active' : 'genre-home'}">Géneros</a>`;
    }
}
