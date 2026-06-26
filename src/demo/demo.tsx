import React from "react";
import ReactDOM from "react-dom/client";
import { DemoApp } from "./DemoApp";
import "../ui/styles/globals.css";
import "../ui/styles/fluentTheme.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>,
);
