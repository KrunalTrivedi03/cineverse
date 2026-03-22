import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { Toaster } from "sonner";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);



