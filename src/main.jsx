import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "./context/AuthContext"; // ← tambah ini

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider> {/* ← wrap App dengan AuthProvider */}
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);