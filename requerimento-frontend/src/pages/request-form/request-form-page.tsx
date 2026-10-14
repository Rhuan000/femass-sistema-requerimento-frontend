import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Paperclip, Send, Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { AsyncState } from "../../components/async-state/async-state";
import { useTemplate } from "../../hooks/use-templates";
import { ApiError, getErrorMessage } from "../../lib/api/http-client";
import { requestService } from "../../lib/api/request-service";
import type { Submission, SubmissionDocument, TemplateField } from "../../lib/types";
import "./request-form-style.scss";

function toSubmissionData(
  fields: TemplateField[],
  values: Record<string, string>,
) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = values[field.campoId] ?? "";
      if (field.type === "date" && value) {
        return [field.campoId, new Date(`${value}T00:00:00.000Z`).toISOString()];
      }
      if (field.type === "number" && value !== "") {
        return [field.campoId, Number(value)];
      }
      return [field.campoId, value];
    }),
  );
}

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

function toFormValue(value: unknown, field: TemplateField) {
  if (value === null || value === undefined) return "";
  if (field.type === "date" && typeof value === "string") return value.slice(0, 10);
  return String(value);
}

function isEditableStatus(status: string | undefined) {
  return status?.toLowerCase() === "rascunho";
}

export function RequestFormPage() {
  const navigate = useNavigate();
  const { templateId, submissionId } = useParams();
  const { data: template, loading, error, reload } = useTemplate(templateId);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [documents, setDocuments] = useState<SubmissionDocument[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const uploadQueue = useRef(Promise.resolve());
  const isDraft = isEditableStatus(submission?.status);
  const isSubmitted = Boolean(submission && !isDraft && submission.submittedAt);

  useEffect(() => {
    if (!template) return;

    let cancelled = false;
    setDraftReady(false);
    setSubmitError(null);

    const loadOrCreateDraft = async () => {
      try {
        let draft: Submission;

        if (submissionId) {
          draft = await requestService.getSubmission(submissionId);
        } else {
          try {
            draft = await requestService.getDraftByTemplate(template.id);
          } catch (requestError) {
            if (!(requestError instanceof ApiError) || requestError.status !== 404) {
              throw requestError;
            }

            draft = await requestService.createSubmission({
              templateId: template.id,
              data: {},
            });
          }
        }

        if (cancelled) return;

        setSubmission(draft);
        setDocuments(draft.documentos ?? []);
        setFormData(
          Object.fromEntries(
            template.fields.map((field) => [
              field.campoId,
              toFormValue(draft.data[field.campoId], field),
            ]),
          ),
        );
        setDraftReady(true);

        if (!submissionId) {
          navigate(`/requests/new/${template.id}/${draft.id}`, { replace: true });
        }
      } catch (requestError) {
        if (!cancelled) setSubmitError(getErrorMessage(requestError));
      }
    };

    void loadOrCreateDraft();
    return () => {
      cancelled = true;
    };
  }, [navigate, submissionId, template]);

  const updateField = (campoId: string, value: string) => {
    setFormData((current) => ({ ...current, [campoId]: value }));
  };

  const saveDraft = async () => {
    if (!template || !submission || !isEditableStatus(submission.status)) {
      return;
    }

    setSaving(true);
    try {
      const result = await requestService.updateSubmission(
        submission.id,
        toSubmissionData(template.fields, formData),
      );
      setSubmission((current) => (current ? { ...current, ...result } : result));
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError));
      throw requestError;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!draftReady || !submission || !isEditableStatus(submission.status)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraft().catch(() => undefined);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [draftReady, formData]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!submission || !files.length) return;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError(`O arquivo ${file.name} excede o limite de 10 MiB.`);
        continue;
      }

      uploadQueue.current = uploadQueue.current.then(async () => {
        try {
          const document = await requestService.uploadDocument(submission.id, file);
          setDocuments((current) => [...current, document]);
        } catch (requestError) {
          setSubmitError(getErrorMessage(requestError));
        }
      });
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    if (!submission) return;

    void requestService
      .deleteDocument(submission.id, documentId)
      .then(() => setDocuments((current) => current.filter((item) => item.id !== documentId)))
      .catch((requestError) => setSubmitError(getErrorMessage(requestError)));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!template) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await uploadQueue.current;
      await saveDraft();
      const result = await requestService.submitSubmission(submission!.id);
      setSubmission((current) => (current ? { ...current, ...result } : current));
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="request-form">
      <div className="request-form__header">
        <Button
          variant="text"
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate("/templates")}
          className="request-form__back-button"
        >
          Voltar
        </Button>
        <div className="request-form__header-text">
          <Typography variant="h4" className="request-form__title">
            {template?.name ?? "Novo requerimento"}
          </Typography>
          <Typography variant="body1" className="request-form__subtitle">
            {template?.description ?? "Carregando os dados do formulário..."}
          </Typography>
        </div>
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload} />

      {template && !loading && !error && (
        <Card className="request-form__card" elevation={0}>
          <CardHeader
            className="request-form__card-header"
            title={
              <div className="request-form__card-header-row">
                <div className="request-form__card-header-text">
                  <Typography variant="h6" className="request-form__card-title">
                    Formulário de requerimento
                  </Typography>
                  <Typography variant="body2" className="request-form__card-description">
                    Campos marcados com * são obrigatórios.
                  </Typography>
                </div>
                <Chip label={template.category} size="small" variant="outlined" />
              </div>
            }
          />

          <CardContent className="request-form__card-content">
            {!template.active && (
              <Alert severity="warning">
                Este template está inativo e não aceita novos envios.
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="request-form__form">
              {template.fields.map((field) => {
                const inputId = `field-${field.campoId}`;
                const value = formData[field.campoId] ?? "";

                return (
                  <div
                    key={field.campoId || field.id || inputId}
                    className="request-form__field"
                  >
                    <label htmlFor={inputId} className="request-form__label">
                      {field.label}
                      {field.required && (
                        <span className="request-form__required" aria-hidden="true">
                          *
                        </span>
                      )}
                    </label>

                    {field.type === "textarea" ? (
                      <TextField
                        id={inputId}
                        multiline
                        minRows={4}
                        value={value}
                        onChange={(event) =>
                          updateField(field.campoId, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={!isDraft}
                        fullWidth
                      />
                    ) : field.type === "select" ? (
                      <FormControl fullWidth required={field.required}>
                        <InputLabel id={`${inputId}-label`}>
                          {field.placeholder || "Selecione"}
                        </InputLabel>
                        <Select
                          id={inputId}
                          labelId={`${inputId}-label`}
                          label={field.placeholder || "Selecione"}
                          value={value}
                          onChange={(event) =>
                            updateField(field.campoId, event.target.value)
                          }
                          disabled={!isDraft}
                        >
                          {(field.options ?? []).map((option, optionIndex) => (
                            <MenuItem
                              key={`${inputId}-${option.value || option.label || optionIndex}`}
                              value={option.value}
                            >
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        id={inputId}
                        type={field.type}
                        value={value}
                        onChange={(event) =>
                          updateField(field.campoId, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={field.required}
                        disabled={!isDraft}
                        fullWidth
                        slotProps={
                          field.type === "number"
                            ? { htmlInput: { step: "any" } }
                            : undefined
                        }
                      />
                    )}

                    {field.description && (
                      <Typography
                        id={`${inputId}-description`}
                        variant="caption"
                        className="request-form__field-description"
                      >
                        {field.description}
                      </Typography>
                    )}
                  </div>
                );
              })}

              <div className="request-form__documents">
                <div>
                  <Typography variant="subtitle1" className="request-form__documents-title">
                    Documentos anexos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG e TXT. Limite de 10 MiB por arquivo.
                  </Typography>
                </div>
                {isDraft && (
                  <Button component="label" variant="outlined" startIcon={<Paperclip size={16} />}>
                    Anexar documentos
                    <input
                      hidden
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={handleFiles}
                    />
                  </Button>
                )}
                {documents.length > 0 && (
                  <div className="request-form__document-list">
                    {documents.map((document) => (
                      <div key={document.id} className="request-form__document">
                        <span>{document.nomeOriginal}</span>
                        <Button
                          type="button"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteDocument(document.id)}
                          disabled={!isDraft}
                          aria-label={`Excluir ${document.nomeOriginal}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && <Alert severity="error">{submitError}</Alert>}

              {draftReady && (
                <Typography variant="caption" color="text.secondary">
                  {saving ? "Salvando rascunho..." : "Rascunho salvo automaticamente."}
                </Typography>
              )}

              <div className="request-form__actions">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/templates")}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Send size={16} />}
                  disabled={submitting || !template.active || !draftReady}
                  fullWidth
                >
                  {submitting ? "Enviando..." : "Enviar requerimento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={isSubmitted} maxWidth="sm" fullWidth>
        <DialogTitle>Requerimento enviado</DialogTitle>
        <DialogContent>
          <Alert severity="success" className="request-form__success-alert">
            O requerimento foi recebido pela API.
          </Alert>
          {submission && (
            <dl className="request-form__confirmation">
              <dt>ID</dt>
              <dd>{submission.id}</dd>
              <dt>Status</dt>
              <dd>{submission.status}</dd>
              <dt>Data do envio</dt>
              <dd>{formatDate(submission.submittedAt)}</dd>
            </dl>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => navigate("/templates")}
          >
            Voltar ao catálogo
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
