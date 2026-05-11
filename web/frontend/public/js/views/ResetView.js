import { auth } from '../main.js';
import { connection } from '../core/connection.js';
import { showMessage } from '../utils.js';
export class ResetView {
    constructor() {
        this.form = null;
    }
    async render() {
        return `
      <div class="login-container">
        <form id="form-reset" method="POST" action="">
          <div class="login-header">
            <h2>Recuperar Contraseña</h2>
            <p>Te enviaremos instrucciones para restablecer tu contraseña</p>
          </div>
          <div id="alerts-container"></div>
          <div class="form-group">
            <input type="email"
                   class="form-control"
                   id="email"
                   name="email"
                   placeholder=" "
                   required>
            <label for="email">Correo Electrónico</label>
          </div>
          <button type="submit" class="btn btn-login">
            Enviar Instrucciones
          </button>
          <div class="login-footer">
            <p><a href="/login">Volver al inicio de sesión</a></p>
          </div>
          <input type="hidden" name="csrf_token_form" value="" id="csrf-reset">
        </form>
      </div>
    `;
    }
    afterRender() {
        this.form = document.getElementById('form-reset');
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
        this.updateCsrfToken();
    }
    cleanup() {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit.bind(this));
        }
    }
    async handleSubmit(e) {
        e.preventDefault();
        if (!this.form)
            return;
        const formData = new FormData(this.form);
        const email = formData.get('email');
        const csrfToken = document.getElementById('csrf-reset')?.value || '';
        try {
            const response = await connection.post('/reset', {
                email,
                csrf_token_form: csrfToken
            });
            if (response?.status === 200) {
                showMessage('Instrucciones enviadas a tu correo', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
        }
        catch (error) {
            showMessage('Error al procesar la solicitud', 'danger');
        }
    }
    updateCsrfToken() {
        const token = auth.getCsrfToken();
        const input = document.getElementById('csrf-reset');
        if (input && token) {
            input.value = token;
        }
    }
}
export default ResetView;
