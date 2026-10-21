import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useAsync } from "../../hooks/use-async";
import { requestService } from "../../lib/api/request-service";
import type { ApprovalRule } from "../../lib/types";
import { ResponsibleSearch } from "./responsible-search";

export function ApprovalFlowEditor({ value, onChange, disabled }: {
  value: ApprovalRule[]; onChange: (value: ApprovalRule[]) => void; disabled: boolean;
}) {
  const { data: people, loading, error, reload } = useAsync(() => requestService.approvalPeople());
  const update = (index: number, patch: Partial<ApprovalRule>) => onChange(value.map((rule, i) => i === index ? { ...rule, ...patch } : rule));
  const move = (index: number, offset: number) => {
    const copy = [...value];
    [copy[index], copy[index + offset]] = [copy[index + offset], copy[index]];
    onChange(copy);
  };
  return <Card variant="outlined"><CardContent>
    <Stack spacing={2}>
      <Typography variant="h6">Fluxo de aprovação dos requerimentos</Typography>
      <Typography variant="body2">As etapas são sequenciais. Uma pessoa do papel indicado aprova cada etapa. A prioridade sinaliza urgência, sem alterar a sequência.</Typography>
      {error && <Alert severity="error" action={<Button onClick={reload}>Tentar novamente</Button>}>{error}</Alert>}
      {value.length === 0 && <Alert severity="info">Sem etapas, o requerimento permanece como ENVIADO, sem aprovação automática.</Alert>}
      {value.map((rule, index) => <Stack key={index} spacing={2} sx={{ border: "1px solid", borderColor: "divider", p: 2, borderRadius: 2 }}>
        <Typography fontWeight={600}>Etapa {index + 1}</Typography>
        <TextField label="Nome da etapa" value={rule.label} disabled={disabled} inputProps={{ maxLength: 150 }} onChange={e => update(index, { label: e.target.value })} />
        <ResponsibleSearch people={people ?? []} loading={loading} includeRoles
          value={rule.userId ? `user:${rule.userId}` : rule.role ? `role:${rule.role}` : null}
          disabled={disabled} onChange={selection => {
            const [kind, id] = selection?.split(":") ?? [];
            update(index, { userId: kind === "user" ? id : null, role: kind === "role" ? id : null });
          }} />
        <TextField select label="Prioridade" value={rule.priority} disabled={disabled} onChange={e => update(index, { priority: Number(e.target.value) })}>
          <MenuItem value={1}>Alta</MenuItem><MenuItem value={2}>Normal</MenuItem><MenuItem value={3}>Baixa</MenuItem>
        </TextField>
        <Stack direction="row" spacing={1}>
          <Button disabled={disabled || index === 0} onClick={() => move(index, -1)}>Subir</Button>
          <Button disabled={disabled || index === value.length - 1} onClick={() => move(index, 1)}>Descer</Button>
          <Button color="error" disabled={disabled} onClick={() => onChange(value.filter((_, i) => i !== index))}>Remover</Button>
        </Stack>
      </Stack>)}
      <Button disabled={disabled || value.length >= 30} onClick={() => onChange([...value, { label: "", role: "SECRETARIA", userId: null, priority: 2 }])}>Adicionar etapa</Button>
    </Stack>
  </CardContent></Card>;
}
