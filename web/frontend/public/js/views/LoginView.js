import { auth } from '../main.js';
export class LoginView {
    constructor() {
        this.form = null;
    }
    async render() {
        return `
      <div class="login-container">
        <form id="form-login" method="POST" action="">
          <div class="login-header">
            <h2>Iniciar Sesión</h2>
            <p>Accede a tu cuenta</p>
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
          <div class="form-group">
            <input type="password"
                   class="form-control"
                   id="password"
                   name="password"
                   placeholder=" "
                   required>
            <label for="password">Contraseña</label>
          </div>
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" name="remember" id="remember">
              <span>Recordar sesión</span>
            </label>
            <a href="/reset" class="forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <button type="submit" class="btn btn-login">
            Iniciar Sesión
          </button>
          <div class="login-footer">
            <p>¿No tienes cuenta?
              <a href="/signup">Regístrate aquí</a>
            </p>
          </div>
        </form>
      </div>
    `;
    }
    afterRender() {
        this.form = document.getElementById('form-login');
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
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
        const password = formData.get('password');
        await auth.login(email, password);
    }
}
export default LoginView;
