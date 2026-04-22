import React from "react";
import ReactDOM from "react-dom/client";
import { StorageProvider } from "../../storage/StorageContext";
import { App } from "./App";
import "../../assets/tailwind.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StorageProvider>
      <App />
    </StorageProvider>
  </React.StrictMode>
);
