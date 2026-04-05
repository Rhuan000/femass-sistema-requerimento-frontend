import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Upload } from "lucide-react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { mockTemplates } from "../../lib/mock-data";
import type { RequestTemplate, SelectOption } from "../../lib/types";
import "./request-form-style.scss";

export function RequestFormPage() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const template = useMemo<RequestTemplate | undefined>(
    () => mockTemplates.find((item) => item.id === templateId),
    [templateId]
  );

  const handleBack = () => {
    navigate("/requests");
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((previous) => ({
      ...previous,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowConfirmDialog(true);
  };

  const confirmSubmit = () => {
    setShowConfirmDialog(false);
    console.log("Enviar requerimento:", {
      templateId: template?.id,
      data: formData,
    });
    setShowSuccessDialog(true);
  };

  const getSelectOptions = (options?: SelectOption[]) => {
    return options ?? [];
  };

  if (!template) {
    return (
      <div className="request-form">
        <div className="request-form__header">
          <Button
            variant="text"
            startIcon={<ArrowLeft size={18} />}
            onClick={handleBack}
            className="request-form__back-button"
          >
            Voltar
          </Button>

          <div className="request-form__header-text">
            <Typography variant="h4" className="request-form__title">
              Modelo não encontrado
            </Typography>

            <Typography variant="body1" className="request-form__subtitle">
              O template solicitado não existe ou não está disponível.
            </Typography>
          </div>
        </div>

        <Card className="request-form__card" elevation={0}>
          <CardContent className="request-form__card-content">
            <Alert severity="warning">
              Verifique o link acessado ou escolha outro modelo na listagem de
              templates.
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="request-form">
      <div className="request-form__header">
        <Button
          variant="text"
          startIcon={<ArrowLeft size={18} />}
          onClick={handleBack}
          className="request-form__back-button"
        >
          Voltar
        </Button>

        <div className="request-form__header-text">
          <Typography variant="h4" className="request-form__title">
            {template.name}
          </Typography>

          <Typography variant="body1" className="request-form__subtitle">
            {template.description}
          </Typography>
        </div>
      </div>

      <Card className="request-form__card" elevation={0}>
        <CardHeader
          className="request-form__card-header"
          title={
            <div className="request-form__card-header-row">
              <div className="request-form__card-header-text">
                <Typography variant="h6" className="request-form__card-title">
                  Formulário de Requerimento
                </Typography>

                <Typography
                  variant="body2"
                  className="request-form__card-description"
                >
                  Preencha os campos abaixo para enviar sua solicitação
                </Typography>
              </div>

              <Chip label={template.category} size="small" variant="outlined" />
            </div>
          }
        />

        <CardContent className="request-form__card-content">
          <form onSubmit={handleSubmit} className="request-form__form">
            {template.fields.map((field) => {
              const fieldKey = field.name || field.id;
              const fieldValue = formData[fieldKey];

              return (
                <div key={field.id} className="request-form__field">
                  <label htmlFor={field.id} className="request-form__label">
                    <span>{field.label}</span>
                    {field.required && (
                      <span className="request-form__required">*</span>
                    )}
                  </label>

                  {field.type === "textarea" ? (
                    <TextField
                      id={field.id}
                      fullWidth
                      multiline
                      minRows={4}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={(fieldValue as string) || ""}
                      onChange={(event) =>
                        handleFieldChange(fieldKey, event.target.value)
                      }
                    />
                  ) : field.type === "select" ? (
                    <FormControl fullWidth required={field.required}>
                      <InputLabel>{field.placeholder || "Selecione"}</InputLabel>
                      <Select
                        id={field.id}
                        value={(fieldValue as string) || ""}
                        label={field.placeholder || "Selecione"}
                        onChange={(event) =>
                          handleFieldChange(fieldKey, event.target.value)
                        }
                      >
                        {getSelectOptions(field.options).map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : field.type === "checkbox" ? (
                    <FormControlLabel
                      control={
                        <Switch
                          id={field.id}
                          checked={(fieldValue as boolean) || false}
                          onChange={(_, checked) =>
                            handleFieldChange(fieldKey, checked)
                          }
                        />
                      }
                      label={
                        field.placeholder || "Marque para confirmar"
                      }
                    />
                  ) : field.type === "file" ? (
                    <Box className="request-form__file-wrapper">
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<Upload size={16} />}
                      >
                        Selecionar arquivo
                        <input
                          hidden
                          id={field.id}
                          type="file"
                          required={field.required}
                          onChange={(event) =>
                            handleFieldChange(
                              fieldKey,
                              event.target.files?.[0]?.name || ""
                            )
                          }
                        />
                      </Button>

                      <Typography
                        variant="body2"
                        className="request-form__file-name"
                      >
                        {(fieldValue as string) || "Nenhum arquivo selecionado"}
                      </Typography>
                    </Box>
                  ) : (
                    <TextField
                      id={field.id}
                      fullWidth
                      required={field.required}
                      type={
                        field.type === "date"
                          ? "date"
                          : field.type === "number"
                            ? "number"
                            : field.type === "email"
                              ? "email"
                              : "text"
                      }
                      placeholder={field.placeholder}
                      value={(fieldValue as string) || ""}
                      onChange={(event) =>
                        handleFieldChange(fieldKey, event.target.value)
                      }
                      InputLabelProps={
                        field.type === "date" ? { shrink: true } : undefined
                      }
                    />
                  )}

                  {field.description && (
                    <Typography
                      variant="caption"
                      className="request-form__field-description"
                    >
                      {field.description}
                    </Typography>
                  )}
                </div>
              );
            })}

            <div className="request-form__actions">
              <Button
                type="button"
                variant="outlined"
                onClick={handleBack}
                fullWidth
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                startIcon={<Send size={16} />}
                fullWidth
              >
                Enviar Requerimento
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar Envio</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você está prestes a enviar o requerimento de{" "}
            <strong>{template.name}</strong>. Deseja confirmar o envio?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={confirmSubmit}>
            Confirmar Envio
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Requerimento Enviado</DialogTitle>
        <DialogContent>
          <Alert severity="success" className="request-form__success-alert">
            Seu requerimento foi enviado com sucesso. Você pode acompanhar o
            status na seção de Requerimentos.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setShowSuccessDialog(false);
              handleBack();
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
