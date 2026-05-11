import { auth } from '../main.js';
import { showMessage } from '../utils.js';
export class SignupView {
    constructor() {
        this.form = null;
    }
    async render() {
        return `
      <div class="login-container">
        <form id="form-signup" method="POST" action="">
          <div class="login-header">
            <h2>Crear Cuenta</h2>
            <p>Regístrate para acceder a todas las funcionalidades</p>
          </div>
          <div id="alerts-container"></div>
          <div class="form-group">
            <input type="text"
                   class="form-control"
                   id="name"
                   name="name"
                   minlength="4"
                   placeholder=" "
                   required>
            <label for="name">Nombre</label>
          </div>
          <div class="form-group">
            <input type="email"
                   class="form-control"
                   id="email"
                   name="email"
                   pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
                   placeholder=" "
                   required>
            <label for="email">Correo electrónico</label>
          </div>
          <div class="form-group">
            <input type="password"
                   class="form-control"
                   id="password"
                   name="password"
                   minlength="4"
                   placeholder=" "
                   required>
            <label for="password">Contraseña</label>
          </div>
          <div class="form-group">
            <input type="password"
                   class="form-control"
                   id="repeat_password"
                   name="repeat_password"
                   minlength="4"
                   placeholder=" "
                   required>
            <label for="repeat_password">Repite la contraseña</label>
          </div>
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" name="terms" id="terms" required>
              <span>Acepto los <a href="/terms" target="_blank">términos y condiciones</a></span>
            </label>
          </div>
          <button type="submit" class="btn btn-login">
            Crear Cuenta
          </button>
          <div class="login-footer">
            <p>¿Ya tienes cuenta?
              <a href="/login">Inicia sesión aquí</a>
            </p>
          </div>
          <input type="hidden" name="csrf_token_form" value="" id="csrf-signup">
        </form>
      </div>
    `;
    }
    afterRender() {
        this.form = document.getElementById('form-signup');
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
        const password = formData.get('password');
        const repeatPassword = formData.get('repeat_password');
        if (password !== repeatPassword) {
            showMessage('Las contraseñas no coinciden', 'danger');
            return;
        }
        const credentials = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: password,
            repeat_password: repeatPassword,
            csrf_token_form: document.getElementById('csrf-signup')?.value || ''
        };
        await auth.signup(credentials);
    }
    updateCsrfToken() {
        const token = auth.getCsrfToken();
        const input = document.getElementById('csrf-signup');
        if (input && token) {
            input.value = token;
        }
    }
}
export default SignupView;
