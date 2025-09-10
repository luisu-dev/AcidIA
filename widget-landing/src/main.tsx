import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Habilita scroll suave solo en dispositivos capaces
try {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const lowPower = isAndroid || (navigator.hardwareConcurrency || 8) <= 4 || window.devicePixelRatio >= 3;
  if (!lowPower) document.documentElement.classList.add("smooth-scroll");
} catch {}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
