import React from "react";
import ReactDOM from "react-dom/client";
import RecorderApp from "./RecorderApp.jsx";
import "../styles/global.css";
import "./recorder.css";

ReactDOM.createRoot(document.getElementById("recorder-root")).render(
  <React.StrictMode>
    <RecorderApp />
  </React.StrictMode>
);
