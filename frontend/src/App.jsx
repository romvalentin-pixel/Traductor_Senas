import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Translator from "./pages/Translator.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

/**
 * Compatibilidad: la grabación de señas dejó de ser parte de la app pública.
 * Ahora vive en la página independiente `/recorder.html` (herramienta interna).
 */
function RecorderRedirect() {
  useEffect(() => {
    window.location.replace("/recorder.html");
  }, []);

  return (
    <div className="card" style={{ maxWidth: 480, margin: "2rem auto" }}>
      <h1 style={{ marginTop: 0 }}>Herramienta interna</h1>
      <p className="muted">
        La grabación de señas ya no forma parte de la app. Abriendo el grabador…
      </p>
      <p style={{ marginBottom: 0 }}>
        Si no se abre solo, entrá a <a href="/recorder.html">/recorder.html</a>.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Herramienta interna, fuera del layout público */}
        <Route path="/grabar-senas" element={<RecorderRedirect />} />

        <Route element={<Layout />}>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
          <Route path="/restablecer-contrasena" element={<ResetPassword />} />

          {/* Privadas */}
          <Route
            path="/traductor"
            element={
              <ProtectedRoute>
                <Translator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
