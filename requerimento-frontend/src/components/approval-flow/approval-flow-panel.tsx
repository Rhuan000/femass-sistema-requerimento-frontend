import { useState } from "react";
import { Alert, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { ResponsibleSearch } from "./responsible-search";
import { useAsync } from "../../hooks/use-async";
import { requestService } from "../../lib/api/request-service";
import { getErrorMessage } from "../../lib/api/http-client";
import type { ApprovalStep } from "../../lib/types";

export function ApprovalFlowPanel({ submissionId, onChange }: { submissionId: string; onChange: () => void }) {
  const { data, loading, error, reload } = useAsync(() => requestService.approvalFlow(submissionId), submissionId);
  const { data: people, loading: loadingPeople, error: peopleError } = useAsync(() => requestService.approvalPeople());
  const [selected, setSelected] = useState<{ step: ApprovalStep; action: "APPROVE" | "REJECT" | "REASSIGN" } | null>(null);
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const execute = async () => {
    if (!selected) return;
    setSaving(true); setActionError(null);
    try {
      await requestService.decideApproval(submissionId, selected.step.id, {
        action: selected.action, version: selected.step.version, reason,
        ...(selected.action === "REASSIGN" ? { targetUserId: target } : {}),
      });
      setSelected(null); setReason(""); setTarget("");
      await reload(); onChange();
    } catch (failure) { setActionError(getErrorMessage(failure)); }
    finally { setSaving(false); }
  };

  return <Card variant="outlined"><CardContent><Stack spacing={2}>
    <Stack direction="row" justifyContent="space-between"><Typography variant="h6">Acompanhamento da aprovação</Typography><Button onClick={reload} disabled={loading || saving}>Atualizar</Button></Stack>
    {loading && <Typography>Carregando etapas...</Typography>}
    {error && <Alert severity="error">{error}</Alert>}
    {data?.steps.length === 0 && <Alert severity="info">Este requerimento não possui fluxo de aprovação. Alterar o template não modifica envios anteriores.</Alert>}
    {data?.steps.map(({ step, responsibleName, canDecide, canReassign }) => <Stack key={step.id} spacing={1} sx={{ borderLeft: "3px solid", borderColor: step.status === "DISPONIVEL" ? "primary.main" : "divider", pl: 2, py: 1 }}>
      <Typography fontWeight={600}>{step.position + 1}. {step.label}</Typography>
      <Typography variant="body2">Responsável: {responsibleName} · Prioridade: {step.priority === 1 ? "Alta" : step.priority === 3 ? "Baixa" : "Normal"}</Typography>
      <div><Chip size="small" label={step.status} color={step.status === "APROVADA" ? "success" : step.status === "REJEITADA" ? "error" : step.status === "DISPONIVEL" ? "primary" : "default"} /></div>
      {step.reason && <Typography variant="body2">Observação: {step.reason}</Typography>}
      {(canDecide || canReassign) && <Stack direction="row" spacing={1} flexWrap="wrap">
        {canDecide && <><Button disabled={saving} onClick={() => { setSelected({ step, action: "APPROVE" }); setReason(""); setActionError(null); }}>Aprovar</Button><Button disabled={saving} color="error" onClick={() => { setSelected({ step, action: "REJECT" }); setReason(""); setActionError(null); }}>Rejeitar</Button></>}
        {canReassign && <Button disabled={saving} onClick={() => { setSelected({ step, action: "REASSIGN" }); setReason(""); setTarget(""); setActionError(null); }}>Encaminhar para outra pessoa</Button>}
      </Stack>}
    </Stack>)}
    {selected && <Stack spacing={2} sx={{ p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
      <Typography fontWeight={600}>{selected.action === "APPROVE" ? "Confirmar aprovação" : selected.action === "REJECT" ? "Confirmar rejeição" : "Encaminhar etapa atual"}: {selected.step.label}</Typography>
      {selected.action === "REASSIGN" && <><Alert severity="info">A pessoa selecionada passa a responder por esta etapa. As etapas seguintes são preservadas.</Alert>
        {peopleError && <Alert severity="error">{peopleError}</Alert>}
        <ResponsibleSearch label="Novo responsável" people={people ?? []} loading={loadingPeople}
          value={target ? `user:${target}` : null} onChange={selection => setTarget(selection?.replace(/^user:/, "") ?? "")} disabled={saving} />
      </>}
      <TextField label={selected.action === "APPROVE" ? "Observação (opcional)" : "Motivo obrigatório"} multiline minRows={2} value={reason} onChange={e => setReason(e.target.value)} inputProps={{ maxLength: 1500 }} disabled={saving} />
      {actionError && <Alert severity="error">{actionError}</Alert>}
      <Stack direction="row" spacing={1}><Button variant="contained" onClick={execute} disabled={saving || (selected.action !== "APPROVE" && !reason.trim()) || (selected.action === "REASSIGN" && !target)}>{saving ? "Salvando..." : "Confirmar"}</Button><Button disabled={saving} onClick={() => setSelected(null)}>Cancelar</Button></Stack>
    </Stack>}
    {!!data?.history.length && <><Typography variant="subtitle1">Histórico</Typography>{data.history.map(event => <Typography key={event.id} variant="body2"><strong>{new Date(event.createdAt).toLocaleString("pt-BR")} · {event.actorName}</strong><br />{event.action}: {event.description}</Typography>)}</>}
  </Stack></CardContent></Card>;
}
