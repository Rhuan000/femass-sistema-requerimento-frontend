# FeMASS Requerimentos

Frontend do sistema de requerimentos, construído com React, TypeScript, Vite e Material UI.

## Desenvolvimento

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` na raiz do projeto. Ele não deve ser commitado. Use `.env.example` como referência:

```env
VITE_API_URL=http://localhost:8080
VITE_KEYCLOAK_URL=http://localhost:8130
VITE_KEYCLOAK_REALM=femass
VITE_KEYCLOAK_CLIENT_ID=femass-frontend
```

As variáveis significam:

- `VITE_API_URL`: URL da API do backend.
- `VITE_KEYCLOAK_URL`: URL do servidor Keycloak.
- `VITE_KEYCLOAK_REALM`: realm utilizado pela aplicação.
- `VITE_KEYCLOAK_CLIENT_ID`: client público configurado no Keycloak.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Para validar o build de produção:

```bash
npm run build
```

O client do Keycloak deve permitir a origem e o redirect URI do frontend, por exemplo:

```text
http://localhost:5173/*
```
