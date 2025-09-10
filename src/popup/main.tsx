import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup.tsx";
import "./index.css";
import "./App.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
