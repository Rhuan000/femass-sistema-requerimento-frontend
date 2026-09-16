import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import keycloak from "./lib/auth/keycloak";

keycloak
    .init({
        onLoad: "login-required",
        checkLoginIframe: false,
    })
    .then((authenticated) => {
        if (!authenticated) {
            console.error("Usuário não autenticado.");
            return;
        }

        createRoot(document.getElementById("root")!).render(
            <StrictMode>
                <App />
            </StrictMode>,
        );
    })
    .catch((error) => {
        console.error("Erro ao inicializar o Keycloak:", error);
    });