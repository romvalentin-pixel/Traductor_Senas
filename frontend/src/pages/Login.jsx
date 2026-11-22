import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { login } from "../services/auth.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Loader from "../components/Loader.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login: doLogin, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/traductor";

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      doLogin(data.access_token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/traductor" replace />;
  }

  return (
    <div style={{ maxWidth: 440, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Iniciar sesión</h1>
        <p className="muted">
          Ingresá tus datos para usar el Traductor y guardar tu historial.
        </p>
        <ErrorMessage message={error} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Loader label="Ingresando…" /> : "Ingresar"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "0.75rem", textAlign: "center" }}>
          <a href="/recuperar-contrasena">¿Olvidaste tu contraseña?</a>
        </p>
        <p className="muted" style={{ marginTop: "0.5rem", textAlign: "center" }}>
          ¿No tenés cuenta? <a href="/register">Registrate gratis</a>
        </p>
      </div>
    </div>
  );
}