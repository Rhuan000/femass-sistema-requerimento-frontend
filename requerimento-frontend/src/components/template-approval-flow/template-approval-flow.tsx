import { useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import type { Template } from "../../lib/types";
import { requestService } from "../../lib/api/request-service";
import { getErrorMessage } from "../../lib/api/http-client";

const transitions = {
  PENDENTE: [
    { action: "approve", label: "Aprovar" },
    { action: "return-for-editing", label: "Devolver para edição" },
  ],
  EDITANDO: [{ action: "submit-approval", label: "Solicitar aprovação" }],
  APROVADO: [{ action: "activate", label: "Ativar" }],
  ATIVO: [{ action: "deactivate", label: "Desativar" }],
  DESATIVADO: [{ action: "activate", label: "Reativar" }],
} as const;

type Action = "approve" | "return-for-editing" | "submit-approval" | "activate" | "deactivate";

export function TemplateApprovalFlow({ template, onChanged }: { template: Template; onChanged: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!template.status) return null;
  const actions: ReadonlyArray<{ action: Action; label: string }> = transitions[template.status];
  const execute = async (action: Action) => {
    setPending(true);
    setError(null);
    try {
      await requestService.transitionTemplate(template.id, action);
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };
  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Typography variant="caption">Fluxo de aprovação: {template.status}</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {actions.map(({ action, label }) => (
          <Button key={action} variant="outlined" size="small" disabled={pending}
            onClick={() => void execute(action)}>{label}</Button>
        ))}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
