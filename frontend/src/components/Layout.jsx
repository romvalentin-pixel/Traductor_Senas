import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const NAV_LINKS = [
  { to: "/", label: "Inicio", end: true },
  { to: "/traductor", label: "Traductor" },
  { to: "/historial", label: "Historial" },
  { to: "/configuracion", label: "Configuración" },
];

export default function Layout() {
  const { isAuthenticated, user, logout, theme, setTheme } = useApp();
  const location = useLocation();

  const links = NAV_LINKS.filter((l) => {
    if (l.to === "/historial" || l.to === "/configuracion") return isAuthenticated;
    return true;
  });

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            🖐 Traductor de Señas
          </NavLink>
          <nav className="navbar-links">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="navbar-right">
            <button
              type="button"
              className="icon-btn"
              title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            {isAuthenticated ? (
              <>
                <span className="muted">👤 {user?.nombre || "Usuario"}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    logout();
                    if (location.pathname !== "/") window.location.href = "/";
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn-secondary">
                  Ingresar
                </NavLink>
                <NavLink to="/register" className="btn btn-primary">
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}