// js/views/NotFoundView.ts
import type { View } from '../core/router.js';

export default class NotFoundView implements View {
    async render(): Promise<string> {
        return `
            <div class="container">
                <div class="container-global-data">
                    <h3>404 - Página no encontrada</h3>
                    <p>El recurso o página al que intenta acceder no existe o no está disponible.</p>
                    <p>Pongase en contacto con un administrador si necesita ayuda.</p>
                    <div style="margin-top: 2rem;">
                        <a href="/" class="btn btn-primary">Volver al inicio</a>
                    </div>
                </div>
            </div>
        `;
    }

    afterRender?(): void {
        // Lógica post-renderizado si es necesaria
    }

    cleanup?(): void {
        // Limpieza si es necesaria
    }
}
