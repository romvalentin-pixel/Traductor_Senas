import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

const STEPS = [
  {
    title: "1 · Permite la cámara",
    text: "Abrí el Traductor y permití el acceso a la cámara cuando el navegador lo pida.",
  },
  {
    title: "2 · Hacé la seña",
    text: "Realizá la seña frente a la cámara. El sistema detecta tu mano y marca 21 puntos de referencia.",
  },
  {
    title: "3 · Lectura y voz",
    text: "El resultado aparece en texto con su nivel de confianza. Podés escucharlo con el botón de voz.",
  },
  {
    title: "4 · Historial",
    text: "Cada traducción se guarda para consultarla o reproducirla cuando quieras.",
  },
];

export default function Home() {
  const { isAuthenticated } = useApp();

  return (
    <>
      <section className="hero">
        <h1>Traductor de Lenguaje de Señas</h1>
        <p>
          Sistema que convierte el lenguaje de señas en texto y voz en tiempo real,
          pensado inicialmente para la <strong>Lengua de Señas Argentina (LSA)</strong>.
        </p>
        <div>
          <Link to={isAuthenticated ? "/traductor" : "/register"} className="btn btn-primary btn-lg">
            Comenzar traducción
          </Link>
        </div>
      </section>

      <div className="grid-two">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>¿Cómo funciona?</h2>
          <ol>
            <li>La cámara captura tu mano en tiempo real.</li>
            <li>MediaPipe identifica 21 puntos de referencia (landmarks).</li>
            <li>Un modelo de Machine Learning clasifica la seña.</li>
            <li>El texto se muestra junto a la confianza del reconocimiento.</li>
            <li>Opcional: el texto se convierte a voz (TTS).</li>
          </ol>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Uso</h2>
          <p>
            Accedé como usuario registrado, luego entrá al <strong>Traductor</strong>.
            Recordá:
          </p>
          <ul>
            <li>Ubicarte con buena iluminación.</li>
            <li>Mostrar la mano a una distancia de 40–80 cm.</li>
            <li>Mantener la seña unos instantes para obtener mayor confianza.</li>
          </ul>
        </div>
      </div>

      <div className="steps">
        {STEPS.map((step) => (
          <div className="step" key={step.title}>
            <b>{step.title}</b>
            <span className="muted">{step.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}