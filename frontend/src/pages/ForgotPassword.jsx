import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/auth.js";
import ErrorMessage from "../components/ErrorMessage.jsx";
import Loader from "../components/Loader.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [demoToken, setDemoToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDemoToken(null);
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setMessage(data?.message || "Si el email está registrado, se generó un código.");
      setDemoToken(data?.demo_reset_token || null);
    } catch (err) {
      setError(err.message || "No se pudo solicitar la recuperación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Recuperar contraseña</h1>
        <p className="muted">
          Ingresá tu email. Si la cuenta existe, se generará un código de recuperación.
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
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Loader label="Generando…" /> : "Generar código"}
          </button>
        </form>

        {message && <div className="alert alert-info" style={{ marginTop: "1rem" }}>{message}</div>}

        {demoToken && (
          <div className="card" style={{ marginTop: "1rem", padding: "0.9rem" }}>
            <p className="muted" style={{ marginTop: 0 }}>
              Código de desarrollo (en producción se envía por correo):
            </p>
            <code style={{ display: "block", wordBreak: "break-all", marginBottom: "0.75rem" }}>
              {demoToken}
            </code>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => navigate(`/restablecer-contrasena?token=${encodeURIComponent(demoToken)}`)}
            >
              Usar este código
            </button>
          </div>
        )}

        <p className="muted" style={{ marginTop: "1rem", textAlign: "center" }}>
          <Link to="/restablecer-contrasena">Ya tengo un código</Link> ·{" "}
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
