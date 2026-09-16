import Keycloak from "keycloak-js";

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM;
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

export const keycloakConfigured = Boolean(
  keycloakUrl && keycloakRealm && keycloakClientId,
);

export const keycloak = keycloakConfigured
  ? new Keycloak({
      url: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
    })
  : null;
