import { ArrowLeft, Download, FileText } from "lucide-react";
import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/async-state/async-state";
import { ApprovalFlowPanel } from "../../components/approval-flow/approval-flow-panel";
import { useAsync } from "../../hooks/use-async";
import { requestService } from "../../lib/api/request-service";
import { getErrorMessage } from "../../lib/api/http-client";
import type { TemplateField } from "../../lib/types";
import "./submission-details-page.scss";

function formatDate(value: string | null | undefined) {
  if (!value) return "Ainda não enviado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

function formatValue(value: unknown, field: TemplateField) {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (field.type === "date" && typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
  }
  if (field.type === "select") {
    return field.options?.find((option) => option.value === String(value))?.label ?? String(value);
  }
  return String(value);
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function statusColor(
  status: string,
): "default" | "primary" | "success" | "warning" | "error" {
  const normalized = status.toLowerCase();
  if (normalized === "em_aprovacao") return "primary";
  if (normalized === "aprovado" || normalized.includes("envi") || normalized.includes("concl")) return "success";
  if (normalized.includes("reje") || normalized.includes("cancel")) return "error";
  if (normalized.includes("analis") || normalized.includes("progress")) return "primary";
  if (normalized.includes("pend") || normalized.includes("rascunho")) return "warning";
  return "default";
}

export function SubmissionDetailsPage() {
  const navigate = useNavigate();
  const { templateId, submissionId } = useParams();
  const { data, loading, error, reload } = useAsync(
    async () => {
      if (!templateId || !submissionId) {
        throw new Error("Requerimento não informado.");
      }
      const [template, submission] = await Promise.all([
        requestService.getTemplate(templateId),
        requestService.getSubmission(submissionId),
      ]);
      return { template, submission };
    },
    `${templateId}:${submissionId}`,
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (documentId: string, fileName: string) => {
    if (!submissionId) return;

    setDownloadingId(documentId);
    setDownloadError(null);
    try {
      const blob = await requestService.downloadDocument(submissionId, documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setDownloadError(getErrorMessage(requestError));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="submission-details">
      <div className="submission-details__header">
        <Button
          variant="text"
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate("/requests")}
        >
          Voltar para envios
        </Button>
        <div className="submission-details__heading">
          <Typography variant="h4" className="submission-details__title">
            {data?.template.name ?? "Detalhes do requerimento"}
          </Typography>
          <Typography variant="body1" className="submission-details__subtitle">
            Consulte as respostas e acompanhe as etapas de aprovação.
          </Typography>
        </div>
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload} />

      {data && !loading && !error && (
        <div className="submission-details__content">
          <ApprovalFlowPanel submissionId={data.submission.id} onChange={() => void reload()} />
          <Card className="submission-details__card" elevation={0}>
            <CardContent>
              <div className="submission-details__summary">
                <div>
                  <Typography variant="overline">ID do requerimento</Typography>
                  <Typography className="submission-details__id">
                    {data.submission.id}
                  </Typography>
                </div>
                <Chip
                  label={data.submission.status}
                  color={statusColor(data.submission.status)}
                />
              </div>
              <Divider />
              <dl className="submission-details__metadata">
                <div>
                  <dt>Usuário</dt>
                  <dd>{data.submission.submittedBy || "Usuário autenticado"}</dd>
                </div>
                <div>
                  <dt>Criado em</dt>
                  <dd>{formatDate(data.submission.createdAt)}</dd>
                </div>
                <div>
                  <dt>Última atualização</dt>
                  <dd>{formatDate(data.submission.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Enviado em</dt>
                  <dd>{formatDate(data.submission.submittedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="submission-details__card" elevation={0}>
            <CardContent className="submission-details__form-content">
              <Typography variant="h6">Respostas do requerimento</Typography>
              <div className="submission-details__fields">
                {data.submission.answers.map((answer) => {
                  const field = data.template.fields.find(item => item.campoId === answer.campoId);
                  return (
                  <TextField
                    key={answer.campoId}
                    label={answer.label}
                    value={field ? formatValue(answer.value, field) : String(answer.value ?? "Não informado")}
                    multiline={field?.type === "textarea"}
                    minRows={field?.type === "textarea" ? 3 : undefined}
                    fullWidth
                    disabled
                  />
                ); })}
              </div>
            </CardContent>
          </Card>

          <Card className="submission-details__card" elevation={0}>
            <CardContent className="submission-details__documents-content">
              <div>
                <Typography variant="h6">Documentos anexados</Typography>
                <Typography variant="body2" color="text.secondary">
                  Arquivos vinculados a este requerimento.
                </Typography>
              </div>
              {data.submission.documentos.length === 0 ? (
                <Alert severity="info">Nenhum documento anexado.</Alert>
              ) : (
                <div className="submission-details__documents">
                  {downloadError && <Alert severity="error">{downloadError}</Alert>}
                  {data.submission.documentos.map((document) => (
                    <div key={document.id} className="submission-details__document">
                      <FileText size={20} aria-hidden="true" />
                      <div>
                        <strong>{document.nomeOriginal}</strong>
                        <span>
                          {document.contentType} · {formatFileSize(document.tamanho)} · {formatDate(document.createdAt)}
                        </span>
                      </div>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download size={16} />}
                        disabled={downloadingId === document.id}
                        onClick={() =>
                          void handleDownload(document.id, document.nomeOriginal)
                        }
                      >
                        {downloadingId === document.id ? "Baixando..." : "Baixar"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
