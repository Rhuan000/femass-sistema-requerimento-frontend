import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
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
import { getErrorMessage } from "../../lib/api/http-client";
import { requestService } from "../../lib/api/request-service";
import type { Submission, TemplateField } from "../../lib/types";
import "./request-form-style.scss";

function toSubmissionData(
  fields: TemplateField[],
  values: Record<string, string>,
) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = values[field.fieldKey] ?? "";
      if (field.type === "date" && value) {
        return [field.fieldKey, new Date(`${value}T00:00:00.000Z`).toISOString()];
      }
      if (field.type === "number" && value !== "") {
        return [field.fieldKey, Number(value)];
      }
      return [field.fieldKey, value];
    }),
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export function RequestFormPage() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { data: template, loading, error, reload } = useTemplate(templateId);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submittedBy, setSubmittedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const updateField = (fieldKey: string, value: string) => {
    setFormData((current) => ({ ...current, [fieldKey]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!template) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await requestService.createSubmission({
        templateId: template.id,
        submittedBy: submittedBy.trim(),
        data: toSubmissionData(template.fields, formData),
      });
      setSubmission(result);
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
              <div className="request-form__field">
                <label htmlFor="submittedBy" className="request-form__label">
                  Identificação do usuário
                  <span className="request-form__required" aria-hidden="true">*</span>
                </label>
                <TextField
                  id="submittedBy"
                  value={submittedBy}
                  onChange={(event) => setSubmittedBy(event.target.value)}
                  placeholder="Nome, matrícula ou e-mail"
                  required
                  fullWidth
                />
              </div>

              {template.fields.map((field) => {
                const inputId = `field-${field.fieldKey}`;
                const value = formData[field.fieldKey] ?? "";

                return (
                  <div key={field.fieldKey} className="request-form__field">
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
                          updateField(field.fieldKey, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={field.required}
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
                            updateField(field.fieldKey, event.target.value)
                          }
                        >
                          {(field.options ?? []).map((option) => (
                            <MenuItem key={option.value} value={option.value}>
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
                          updateField(field.fieldKey, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={field.required}
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

              {submitError && <Alert severity="error">{submitError}</Alert>}

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
                  disabled={submitting || !template.active}
                  fullWidth
                >
                  {submitting ? "Enviando..." : "Enviar requerimento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(submission)} maxWidth="sm" fullWidth>
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
