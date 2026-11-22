export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-error fade-in" role="alert">
      <div>{message}</div>
      {onRetry && (
        <button type="button" className="btn btn-secondary" style={{ marginTop: "0.5rem" }} onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}