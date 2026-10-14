import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { keycloak, keycloakConfigured } from "./keycloak";

interface AuthContextValue {
  authenticated: boolean;
  initializing: boolean;
  configurationError: string | null;
  username: string | undefined;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
let initialization: Promise<boolean> | undefined;

function initializeKeycloak() {
  if (!keycloak) return Promise.resolve(false);
  initialization ??= keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
  return initialization;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  useEffect(() => {
    if (!keycloakConfigured || !keycloak) {
      setConfigurationError(
        "Configure VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM e VITE_KEYCLOAK_CLIENT_ID para entrar.",
      );
      setInitializing(false);
      return;
    }

    const client = keycloak;
    let active = true;
    void initializeKeycloak()
      .then((loggedIn) => {
        if (!active) return;
        setAuthenticated(loggedIn);
        if (loggedIn && client.token) {
          localStorage.setItem("token", client.token);
        }
      })
      .catch(() => {
        if (active) {
          setConfigurationError("Não foi possível conectar ao Keycloak.");
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    const refreshToken = window.setInterval(() => {
      if (!client.authenticated) return;
      void client
        .updateToken(30)
        .then(() => {
          if (client.token) localStorage.setItem("token", client.token);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setAuthenticated(false);
        });
    }, 20000);

    return () => {
      active = false;
      window.clearInterval(refreshToken);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      initializing,
      configurationError,
      username: keycloak?.tokenParsed?.preferred_username,
      login: async () => {
        if (keycloak) await keycloak.login();
      },
      logout: async () => {
        localStorage.removeItem("token");
        if (keycloak) await keycloak.logout({ redirectUri: window.location.origin });
      },
    }),
    [authenticated, configurationError, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
