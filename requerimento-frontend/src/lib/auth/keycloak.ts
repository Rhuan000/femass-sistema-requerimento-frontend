import Keycloak from "keycloak-js";

const url = import.meta.env.VITE_KEYCLOAK_URL;
const realm = import.meta.env.VITE_KEYCLOAK_REALM;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

export const keycloakConfigured = Boolean(url && realm && clientId);

export const keycloak = keycloakConfigured
  ? new Keycloak({ url, realm, clientId })
  : undefined;

export default keycloak;
