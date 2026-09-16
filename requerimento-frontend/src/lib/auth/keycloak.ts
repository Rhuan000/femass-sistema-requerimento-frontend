import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8130",
    realm: "femass",
    clientId: "femass-frontend",
});

export default keycloak;