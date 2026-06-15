import { Alert, Button, CircularProgress, Typography } from "@mui/material";
import { Inbox } from "lucide-react";
import "./async-state.scss";

interface AsyncStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
}

export function AsyncState({
  loading,
  error,
  empty,
  emptyTitle = "Nenhum item encontrado",
  emptyDescription = "Não há dados para exibir.",
  onRetry,
}: AsyncStateProps) {
  if (loading) {
    return (
      <div className="async-state" role="status" aria-live="polite">
        <CircularProgress size={32} />
        <Typography>Carregando...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : undefined
        }
      >
        {error}
      </Alert>
    );
  }

  if (empty) {
    return (
      <div className="async-state">
        <Inbox size={36} aria-hidden="true" />
        <Typography variant="h6">{emptyTitle}</Typography>
        <Typography variant="body2">{emptyDescription}</Typography>
      </div>
    );
  }

  return null;
}
