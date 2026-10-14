import { Alert, Button, Card, CardContent, Typography } from "@mui/material";
import { LogIn } from "lucide-react";
import { useAuth } from "../../lib/auth/auth-context";
import "./login-page.scss";

export function LoginPage() {
  const { configurationError, login } = useAuth();

  return (
    <main className="login-page">
      <Card className="login-page__card" elevation={0}>
        <CardContent className="login-page__content">
          <div className="login-page__mark" aria-hidden="true">F</div>
          <Typography variant="overline" className="login-page__eyebrow">
            Sistema de requerimentos
          </Typography>
          <Typography variant="h3" className="login-page__title">
            Acesse sua conta
          </Typography>
          <Typography variant="body1" className="login-page__description">
            Entre com o Keycloak para criar, acompanhar e enviar seus requerimentos.
          </Typography>
          {configurationError && <Alert severity="error">{configurationError}</Alert>}
          <Button
            variant="contained"
            size="large"
            startIcon={<LogIn size={18} />}
            onClick={() => void login()}
            disabled={Boolean(configurationError)}
            fullWidth
          >
            Entrar com Keycloak
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
