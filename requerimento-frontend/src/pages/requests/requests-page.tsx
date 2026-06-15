import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
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
import { useTemplates } from "../../hooks/use-templates";
import { requestService } from "../../lib/api/request-service";
import type { Submission } from "../../lib/types";
import "./requests-page-style.scss";

function formatDate(value: string) {
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
        <div key={answer.fieldKey}>
          <dt>{answer.label}</dt>
          <dd>{String(answer.value ?? "")}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RequestsPage() {
  const { data: templates, loading: loadingTemplates, error: templatesError, reload } =
    useTemplates();
  const [templateId, setTemplateId] = useState("");
  const [search, setSearch] = useState("");

  const selectedTemplateId = templateId || templates?.[0]?.id || "";

  const {
    data: submissions,
    loading: loadingSubmissions,
    error: submissionsError,
    reload: reloadSubmissions,
  } = useAsync(
    () =>
      selectedTemplateId
        ? requestService.listSubmissionsByTemplate(selectedTemplateId)
        : Promise.resolve([]),
    selectedTemplateId,
  );

  const filtered = useMemo(() => {
    const query = search.toLocaleLowerCase("pt-BR").trim();
    return (submissions ?? []).filter(
      (submission) =>
        submission.id.toLocaleLowerCase("pt-BR").includes(query) ||
        submission.submittedBy.toLocaleLowerCase("pt-BR").includes(query) ||
        submission.status.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [search, submissions]);

  const loading =
    loadingTemplates || (Boolean(selectedTemplateId) && loadingSubmissions);
  const error = templatesError || submissionsError;

  return (
    <div className="requests-list">
      <div className="requests-list__header">
        <Typography variant="h4" className="requests-list__title">
          Consulta de envios
        </Typography>
        <Typography variant="body1" className="requests-list__subtitle">
          Selecione um template para consultar os requerimentos recebidos.
        </Typography>
      </div>

      {!loadingTemplates && !templatesError && (
        <div className="requests-list__filters">
          <FormControl className="requests-list__template-select">
            <InputLabel id="template-filter-label">Template</InputLabel>
            <Select
              labelId="template-filter-label"
              value={selectedTemplateId}
              label="Template"
              onChange={(event) => setTemplateId(event.target.value)}
            >
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
            placeholder="Buscar por ID, usuário ou status"
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
        onRetry={templatesError ? reload : reloadSubmissions}
        empty={!loading && !error && filtered.length === 0}
        emptyTitle={
          templates?.length === 0 ? "Nenhum template cadastrado" : "Nenhum envio encontrado"
        }
        emptyDescription={
          search
            ? "Ajuste o termo de busca."
            : "Este template ainda não possui envios."
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
                    <span>Usuário</span>
                    <strong>{submission.submittedBy}</strong>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
