import { useCallback, useEffect, useState } from "react";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Loader from "../components/Loader.jsx";
import RecordSigns from "../pages/RecordSigns.jsx";
import { login as loginRequest, me } from "../services/auth.js";

const TOKEN_KEY = "sl_token";
const USER_KEY = "sl_user";

/**
 * Herramienta interna y separada de la app pública.
 *
 * No comparte navbar, rutas ni estado con el traductor: se sirve como página
 * independiente (`/recorder.html`) para que el usuario final nunca la vea.
 * Las señas grabadas acá se registran solas en el catálogo y aparecen en la app.
 */
export default function RecorderApp() {
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setStatus("anonymous");
      return;
    }
    let cancelled = false;
    me()
      .then((data) => {
        if (cancelled) return;
        setUser(data);
        setStatus(data.is_admin ? "ready" : "forbidden");
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  async function handleLogin(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setPassword("");
      setStatus(data.user?.is_admin ? "ready" : "forbidden");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="recorder-shell">
      <header className="recorder-header">
        <div className="recorder-brand">
          <strong>🛠 Grabador de señas</strong>
          <span className="recorder-tag">herramienta interna</span>
        </div>
        <div className="recorder-actions">
          {user && (
            <span className="muted recorder-user">👤 {user.nombre || user.email}</span>
          )}
          <a className="btn btn-secondary" href="/">
            Abrir la app
          </a>
          {user && (
            <button type="button" className="btn btn-secondary" onClick={clearSession}>
              Salir
            </button>
          )}
        </div>
      </header>

      <main className="container recorder-main">
        <div className="alert alert-info">
          Esta página es solo para el equipo que carga las señas. El usuario final
          entra a la app normal y ve las señas ya disponibles en el Traductor.
        </div>

        {status === "checking" && <Loader label="Verificando sesión…" />}

        {status === "anonymous" && (
          <div style={{ maxWidth: 440, margin: "1.5rem auto" }}>
            <div className="card">
              <h1 style={{ marginTop: 0 }}>Ingresar al grabador</h1>
              <p className="muted">
                Usá una cuenta del sistema. Las muestras y el entrenamiento quedan
                asociados a esa sesión.
              </p>
              <ErrorMessage message={error} />
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="recorder-email">Email</label>
                  <input
                    id="recorder-email"
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="tu@email.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="recorder-password">Contraseña</label>
                  <input
                    id="recorder-password"
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? <Loader label="Ingresando…" /> : "Ingresar"}
                </button>
              </form>
              <p className="muted" style={{ marginBottom: 0, marginTop: "0.75rem" }}>
                ¿No tenés cuenta? Creala en <a href="/register">la app principal</a> y
                volvé a esta página.
              </p>
            </div>
          </div>
        )}

        {status === "ready" && <RecordSigns />}

        {status === "forbidden" && (
          <div style={{ maxWidth: 520, margin: "1.5rem auto" }}>
            <div className="card">
              <h1 style={{ marginTop: 0 }}>Sin acceso al grabador</h1>
              <p className="muted">
                Tu cuenta no tiene permisos para cargar señas. Pedile al
                administrador que agregue tu email a <code>ADMIN_EMAILS</code> en
                el backend.
              </p>
              <button type="button" className="btn btn-secondary" onClick={clearSession}>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
