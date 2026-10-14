import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getErrorMessage } from "../api/http-client";
import { requestService } from "../api/request-service";
import type { CurrentUser, UserPermissions } from "../types";
import { keycloak, keycloakConfigured } from "./keycloak";

interface AuthContextValue {
  authenticated: boolean;
  initializing: boolean;
  configurationError: string | null;
  username: string | undefined;
  /** Usuário e permissões devolvidos por GET /me. */
  currentUser: CurrentUser | null;
  /** Erro ao carregar GET /me (ex.: usuário sem cadastro no banco). */
  profileError: string | null;
  /** Apenas para montar a tela; o backend continua validando cada chamada. */
  permissions: UserPermissions;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const NO_PERMISSIONS: UserPermissions = {
  canCreateTemplate: false,
  canManageTemplates: false,
  canApproveTemplates: false,
  canCreateSubmission: false,
};

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
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

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
      .then(async (loggedIn) => {
        if (!active) return;
        if (loggedIn && client.token) {
          localStorage.setItem("token", client.token);
        }
        if (loggedIn) {
          try {
            const user = await requestService.getCurrentUser();
            if (active) setCurrentUser(user);
          } catch (requestError) {
            if (active) setProfileError(getErrorMessage(requestError));
          }
        }
        if (active) setAuthenticated(loggedIn);
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
      currentUser,
      profileError,
      permissions: currentUser?.permissions ?? NO_PERMISSIONS,
      login: async () => {
        if (keycloak) await keycloak.login();
      },
      logout: async () => {
        localStorage.removeItem("token");
        if (keycloak) await keycloak.logout({ redirectUri: window.location.origin });
      },
    }),
    [authenticated, configurationError, currentUser, initializing, profileError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
