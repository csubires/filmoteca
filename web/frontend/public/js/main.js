import { Router } from './core/router.js';
import { connection } from './core/connection.js';
import { AuthService } from './services/auth.service.js';
export const auth = new AuthService(connection);
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
    '/menu/torrent': () => import('./views/TorrentView.js'),
    '/maintenance/:section': () => import('./views/MaintenanceView.js')
};
const router = new Router(routes);
let genresLoaded = false;
document.addEventListener('DOMContentLoaded', () => {
    router.handleRoute();
    setupMenuClickToggle();
    setupCardInfoPositioning();
});
window.addEventListener('navigation-complete', () => {
    loadNavigation();
    if (!genresLoaded) {
        loadGenres();
    }
    setupCardInfoPositioning();
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
    document.addEventListener('card-info-shown', ((e) => {
        const { movieId } = e.detail;
        const infoPanel = document.getElementById(`info-${movieId}`);
        const trigger = document.querySelector(`[data-action="show-info"][data-id="${movieId}"]`);
        if (infoPanel && trigger) {
            positionInfoPanel(infoPanel, trigger);
        }
    }));
}
function positionInfoPanel(panel, trigger) {
    const cardRect = trigger.closest('.card-film')?.getBoundingClientRect();
    if (!cardRect)
        return;
    const panelWidth = 280;
    const panelHeight = 320;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = cardRect.right + margin;
    let top = cardRect.top;
    if (left + panelWidth > viewportWidth - margin) {
        left = cardRect.left - panelWidth - margin;
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
            <a href="/menu/genres" ${isActive('/menu/genres') ? 'class="active"' : ''}>Géneros</a>
            <a href="/menu/statistics" ${isActive('/menu/statistics') ? 'class="active"' : ''}>Estadísticas</a>
            <a href="/menu/inventories" ${isActive('/menu/inventories') ? 'class="active"' : ''}>Listados</a>
            <a href="/menu/torrent" ${isActive('/menu/torrent') ? 'class="active"' : ''}>Torrents</a>
            ${user?.role === 'admin' ? `
            <a href="/auth/search" ${isActive('/auth/search') ? 'class="active"' : ''}>Búsqueda Avanzada</a>
            <a href="/maintenance/general" ${isActive('/maintenance') ? 'class="active"' : ''}>Mantenimiento</a>
            ` : ''}
            <a href="#" id="logout-btn">Salir</a>
        `;
    }
    else {
        menuHtml = `
            <a class="mark-opt" href="/login" ${isActive('/login') ? 'class="active"' : ''}>Iniciar Sesión</a>
            <a href="/signup" ${isActive('/signup') ? 'class="active"' : ''}>Registrarse</a>
            <a href="/reset" ${isActive('/reset') ? 'class="active"' : ''}>Recuperar contraseña</a>
            <a href="/menu/genres" ${isActive('/menu/genres') ? 'class="active"' : ''}>Géneros</a>
            <a href="/view/0" ${isActive('/view') ? 'class="active"' : ''}>Recientes</a>
            <a href="/menu/inventories" ${isActive('/menu/inventories') ? 'class="active"' : ''}>Listados</a>
            <a href="/menu/torrent" ${isActive('/menu/torrent') ? 'class="active"' : ''}>Torrents</a>
        `;
    }
    menuHtml += `
        <div class="theme-toggle">
            <button class="btn-theme" data-action="light-mode" title="Modo claro">☀</button>
            <button class="btn-theme" data-action="dark-mode" title="Modo oscuro">☾</button>
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
    document.querySelectorAll('[data-action="light-mode"], [data-action="dark-mode"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const theme = action === 'light-mode' ? 'light' : 'dark';
            applyTheme(theme);
            localStorage.setItem('theme', theme);
        });
    });
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
        if (Array.isArray(genres) && genres.length > 0) {
            genreMenu.innerHTML = genres
                .map((g) => `<a href="/menu/genres/${g.id_genre}" ${window.location.pathname === `/menu/genres/${g.id_genre}` ? 'class="active"' : ''}>${g.name}</a>`).join('');
            genresLoaded = true;
        }
        else {
            genreMenu.innerHTML = '';
        }
    }
    catch (error) {
        console.error('Error loading genres:', error);
        genreMenu.innerHTML = '';
    }
}
