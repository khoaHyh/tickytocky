import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./app"

import "./styles.css"

const root = document.getElementById("root")

if (!(root instanceof HTMLElement)) {
  throw new Error("Expected an element with id 'root'.")
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
