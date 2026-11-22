export default function Loader({ label = "Cargando…" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", padding: "0.5rem 0" }}>
      <span className="spinner" aria-hidden="true" />
      <span className="muted">{label}</span>
    </div>
  );
}