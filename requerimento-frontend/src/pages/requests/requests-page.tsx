import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { AsyncState } from "../../components/async-state/async-state";
import { useAsync } from "../../hooks/use-async";
import { requestService } from "../../lib/api/request-service";
import type { Submission } from "../../lib/types";
import "./requests-page-style.scss";

function formatDate(value: string | null) {
  if (!value) return "Ainda não enviado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

function statusColor(
  status: string,
): "default" | "primary" | "success" | "warning" | "error" {
  const normalized = status.toLowerCase();
  if (normalized.includes("aprov") || normalized.includes("concl")) return "success";
  if (normalized.includes("reje") || normalized.includes("cancel")) return "error";
  if (normalized.includes("analis") || normalized.includes("progress")) return "primary";
  if (normalized.includes("pend")) return "warning";
  return "default";
}

function Answers({ submission }: { submission: Submission }) {
  if (!submission.answers.length) return <span>Nenhuma resposta</span>;

  return (
    <dl className="requests-list__answers">
      {submission.answers.map((answer) => (
        <div key={answer.campoId}>
          <dt>{answer.label}</dt>
          <dd>{String(answer.value ?? "")}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RequestsPage() {
  const navigate = useNavigate();
  const [templateId, setTemplateId] = useState("");
  const [search, setSearch] = useState("");

  const {
    data: submissions,
    loading: loadingSubmissions,
    error: submissionsError,
    reload: reloadSubmissions,
  } = useAsync(
    () => requestService.listSubmissions(),
  );

  const templates = useMemo(() => {
    const options = new Map<string, string>();
    for (const submission of submissions ?? []) {
      options.set(submission.templateId, submission.templateName || submission.templateId);
    }
    return Array.from(options, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [submissions]);

  const filtered = useMemo(() => {
    const query = search.toLocaleLowerCase("pt-BR").trim();
    return (submissions ?? []).filter(
      (submission) => {
        if (templateId && submission.templateId !== templateId) return false;
        const searchable = [
          submission.id,
          submission.submittedBy,
          submission.status,
          submission.templateName,
        ]
          .map((value) => String(value ?? "").toLocaleLowerCase("pt-BR"))
          .join(" ");
        return searchable.includes(query);
      },
    );
  }, [search, submissions, templateId]);

  const loading = loadingSubmissions;
  const error = submissionsError;

  return (
    <div className="requests-list">
      <div className="requests-list__header">
        <Typography variant="h4" className="requests-list__title">
          Consulta de envios
        </Typography>
        <Typography variant="body1" className="requests-list__subtitle">
          Consulte os requerimentos recebidos ou filtre por template.
        </Typography>
      </div>

      {!loading && !error && (
        <div className="requests-list__filters">
          <FormControl className="requests-list__template-select">
            <InputLabel id="template-filter-label" shrink>Template</InputLabel>
            <Select
              labelId="template-filter-label"
              value={templateId}
              displayEmpty
              notched
              label="Template"
              onChange={(event) => setTemplateId(event.target.value)}
            >
              <MenuItem value="">Todos os templates</MenuItem>
              {(templates ?? []).map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            className="requests-list__search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por ID, usuário, status ou template"
            slotProps={{
              input: {
                startAdornment: <Search size={18} className="requests-list__search-icon" />,
              },
            }}
          />
        </div>
      )}

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reloadSubmissions}
        empty={!loading && !error && filtered.length === 0}
        emptyTitle={
          "Nenhum envio encontrado"
        }
        emptyDescription={
          search
            ? "Ajuste o termo de busca."
            : templateId
              ? "Este template ainda não possui envios."
              : "Ainda não há envios para consultar."
        }
      />

      {!loading && !error && filtered.length > 0 && (
        <div className="requests-list__cards">
          {filtered.map((submission) => (
            <Card key={submission.id} className="requests-list__submission" elevation={0}>
              <CardContent>
                <div className="requests-list__submission-header">
                  <div>
                    <Typography variant="overline">ID do envio</Typography>
                    <Typography className="requests-list__cell-id">
                      {submission.id}
                    </Typography>
                  </div>
                  <Chip
                    label={submission.status}
                    color={statusColor(submission.status)}
                    size="small"
                  />
                </div>
                <div className="requests-list__metadata">
                  <div>
                    <span>Template</span>
                    <strong>{submission.templateName || submission.templateId}</strong>
                  </div>
                  <div>
                    <span>Usuário</span>
                    <strong>{submission.submittedBy || "Usuário autenticado"}</strong>
                  </div>
                  <div>
                    <span>Data</span>
                    <strong>{formatDate(submission.submittedAt)}</strong>
                  </div>
                </div>
                <div className="requests-list__answers-block">
                  <Typography variant="subtitle2">Respostas</Typography>
                  <Answers submission={submission} />
                </div>
                <Button
                  variant="outlined"
                  startIcon={<Eye size={16} />}
                  onClick={() =>
                    navigate(`/requests/${submission.templateId}/${submission.id}`)
                  }
                >
                  Ver requerimento completo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
