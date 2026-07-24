import React from "react";
import { createRoot } from "react-dom/client";
import SummaryQuiz from "../../summary-app/page";
import "../../summary-app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element was not found.");

createRoot(root).render(
  <React.StrictMode>
    <SummaryQuiz />
  </React.StrictMode>,
);
