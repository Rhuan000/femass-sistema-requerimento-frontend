import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ChevronDown, FileText, Plus, Trash2 } from "lucide-react";
import { AsyncState } from "../../components/async-state/async-state";
import { TemplateStatusChip } from "../../components/template-status-chip/template-status-chip";
import { useAsync } from "../../hooks/use-async";
import { getErrorMessage, getFieldErrors } from "../../lib/api/http-client";
import { requestService } from "../../lib/api/request-service";
import { useAuth } from "../../lib/auth/auth-context";
import {
  FIELD_TYPES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUS_INFO,
  type FieldType,
  type SelectOption,
  type TemplateField,
  type TemplateInput,
} from "../../lib/types";
import "./template-builder-styles.scss";

interface EditableField extends TemplateField {
  clientId: string;
}

// Identificador técnico do campo ("fieldKey" no backend): letras minúsculas,
// números e "_". Gerado automaticamente; o formato é validado pelo backend.
const createCampoId = () =>
  `campo_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const createClientId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createField = (position: number): EditableField => ({
  clientId: createClientId(),
  campoId: createCampoId(),
  label: "",
  type: "text",
  required: false,
  placeholder: "",
  description: "",
  position,
  options: undefined,
});

function TemplateBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { permissions } = useAuth();
  const {
    data: loadedTemplate,
    loading,
    error: loadError,
    reload,
  } = useAsync(
    () => (id ? requestService.getTemplate(id) : Promise.resolve(null)),
    id,
  );

  const [template, setTemplate] = useState<TemplateInput>({
    name: "",
    description: "",
    category: TEMPLATE_CATEGORIES[0],
    fields: [],
  });
  const [fields, setFields] = useState<EditableField[]>([]);
  const [initializedId, setInitializedId] = useState<string | null | undefined>(
    undefined,
  );
  const [expandedId, setExpandedId] = useState<string | false>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Erros devolvidos pelo backend, por clientId do campo e propriedade. */
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || initializedId === (id ?? null)) return;

    if (loadedTemplate) {
      setTemplate({
        name: loadedTemplate.name,
        description: loadedTemplate.description,
        category: loadedTemplate.category,
        fields: [],
      });
      const editableFields = loadedTemplate.fields.map((field) => ({
        ...field,
        clientId: createClientId(),
        options: field.options?.map((option) => ({ ...option })),
      }));
      setFields(editableFields);
      setExpandedId(editableFields[0]?.clientId ?? false);
    }

    setInitializedId(id ?? null);
  }, [id, initializedId, loadedTemplate, loading]);

  const updateField = (clientId: string, patch: Partial<EditableField>) => {
    setFields((current) =>
      current.map((field) => {
        if (field.clientId !== clientId) return field;
        const next = { ...field, ...patch };

        if (patch.type && patch.type !== "select") next.options = undefined;
        if (patch.type === "select" && !next.options?.length) {
          next.options = [{ label: "", value: "" }];
        }
        return next;
      }),
    );
  };

  const updateOption = (
    clientId: string,
    optionIndex: number,
    patch: Partial<SelectOption>,
  ) => {
    const field = fields.find((item) => item.clientId === clientId);
    const options = (field?.options ?? []).map((option, index) =>
      index === optionIndex ? { ...option, ...patch } : option,
    );
    updateField(clientId, { options });
  };

  const addField = () => {
    const field = createField(fields.length + 1);
    setFields((current) => [...current, field]);
    setExpandedId(field.clientId);
  };

  const removeField = (clientId: string) => {
    setFields((current) =>
      current
        .filter((field) => field.clientId !== clientId)
        .map((field, index) => ({ ...field, position: index + 1 })),
    );
  };

  // Regras dos campos (lista vazia, rótulo, identificador) são validadas pelo
  // backend e voltam em fieldErrors. Aqui ficam só as checagens que o backend
  // ainda não faz.
  const validate = () => {
    if (!template.name.trim()) return "Informe o nome do template.";
    if (!template.category.trim()) return "Informe a categoria.";

    for (const field of fields) {
      if (
        field.type === "select" &&
        (!field.options?.length ||
          field.options.some(
            (option) => !option.label.trim() || !option.value.trim(),
          ))
      ) {
        return `Preencha o label e o value de todas as opções de "${field.label || "campo sem rótulo"}".`;
      }
    }

    const positions = fields.map((field) => field.position);
    if (new Set(positions).size !== positions.length) {
      return "As posições dos campos não podem se repetir.";
    }
    return null;
  };

  const readOnly = Boolean(
    id && loadedTemplate && !loadedTemplate.availableActions.includes("edit"),
  );

  const handleSave = async () => {
    if (readOnly) return;
    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setFieldErrors({});

    const sortedFields = [...fields].sort((a, b) => a.position - b.position);
    const payload: TemplateInput = {
      ...template,
      name: template.name.trim(),
      description: template.description.trim(),
      category: template.category.trim(),
      fields: sortedFields.map((field) => ({
          id: field.id,
          campoId: field.campoId,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          description: field.description,
          position: field.position,
          options: field.type === "select" ? field.options : undefined,
        })),
    };

    try {
      if (id) await requestService.updateTemplate(id, payload);
      else await requestService.createTemplate(payload);
      navigate("/templates");
    } catch (requestError) {
      setSaveError(getErrorMessage(requestError));

      // As chaves seguem o JSON enviado: "fields" ou "fields[i].label".
      const byField: Record<string, Record<string, string>> = {};
      for (const [key, message] of Object.entries(getFieldErrors(requestError))) {
        const match = /^fields\[(\d+)\]\.(\w+)$/.exec(key);
        const field = match ? sortedFields[Number(match[1])] : undefined;
        if (!field || !match) continue;
        byField[field.clientId] = { ...byField[field.clientId], [match[2]]: message };
      }
      setFieldErrors(byField);
      const firstWithError = sortedFields.find((field) => byField[field.clientId]);
      if (firstWithError) setExpandedId(firstWithError.clientId);
    } finally {
      setSaving(false);
    }
  };

  if (!id && !permissions.canCreateTemplate) {
    return (
      <div className="template-builder">
        <Alert severity="warning">
          Somente diretor, coordenador ou secretaria podem criar templates e
          solicitar aprovação.
        </Alert>
        <div>
          <Button variant="outlined" onClick={() => navigate("/templates")}>
            Voltar para o catálogo
          </Button>
        </div>
      </div>
    );
  }

  if (id && (loading || loadError)) {
    return (
      <AsyncState loading={loading} error={loadError} onRetry={reload} />
    );
  }

  return (
    <div className="template-builder">
      <div className="template-builder__topbar">
        <div className="template-builder__topbar-text">
          <Typography variant="h4" className="template-builder__title">
            {id ? "Editar template" : "Novo template"}
          </Typography>
          <Typography variant="body1" className="template-builder__subtitle">
            Configure os dados e os campos do formulário dinâmico.
          </Typography>
        </div>
        <Button variant="contained" onClick={handleSave} disabled={saving || readOnly}>
          {saving ? "Salvando..." : id ? "Salvar alterações" : "Enviar para aprovação"}
        </Button>
      </div>

      {!id && (
        <Alert severity="info">
          Ao salvar, o template fica aguardando a aprovação do diretor antes de
          ser disponibilizado.
        </Alert>
      )}
      {readOnly && loadedTemplate && (
        <Alert severity="warning">
          Você não pode alterar este template enquanto ele estiver como "
          {TEMPLATE_STATUS_INFO[loadedTemplate.status].label}".
        </Alert>
      )}
      {id && !readOnly && (
        <Alert severity="info">
          Depois de salvar, use "Enviar para aprovação" na tela de templates para
          que o diretor avalie as alterações.
        </Alert>
      )}
      {saveError && <Alert severity="error">{saveError}</Alert>}

      <div className="template-builder__layout">
        <div className="template-builder__main">
          <Card className="template-builder__card" elevation={0}>
            <CardContent className="template-builder__card-content">
              <Typography variant="h6">Informações gerais</Typography>
              <div className="template-builder__field-grid">
                <TextField
                  label="Nome"
                  value={template.name}
                  onChange={(event) =>
                    setTemplate((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  fullWidth
                />
                <TextField
                  select
                  label="Categoria"
                  value={template.category}
                  onChange={(event) =>
                    setTemplate((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  required
                  fullWidth
                >
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  className="template-builder__field-grid-full"
                  label="Descrição"
                  value={template.description}
                  onChange={(event) =>
                    setTemplate((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  multiline
                  minRows={3}
                  fullWidth
                />
              </div>
            </CardContent>
          </Card>

          <Card className="template-builder__card" elevation={0}>
            <CardContent className="template-builder__card-content">
              <div className="template-builder__topbar">
                <div>
                  <Typography variant="h6">Campos do formulário</Typography>
                  <Typography variant="body2" className="template-builder__subtitle">
                    A posição determina a ordem exibida ao usuário.
                  </Typography>
                </div>
                <Button
                  variant="outlined"
                  startIcon={<Plus size={18} />}
                  onClick={addField}
                >
                  Adicionar campo
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="template-builder__empty-state">
                  <FileText size={32} />
                  <Typography variant="h6">Nenhum campo configurado</Typography>
                  <Button variant="contained" onClick={addField}>
                    Criar primeiro campo
                  </Button>
                </div>
              ) : (
                <div className="template-builder__fields">
                  {fields.map((field, index) => {
                    return (
                      <Accordion
                        key={field.clientId}
                        expanded={expandedId === field.clientId}
                        onChange={(_, expanded) =>
                          setExpandedId(expanded ? field.clientId : false)
                        }
                        className="template-builder__accordion"
                        disableGutters
                        elevation={0}
                      >
                        <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                          <div className="template-builder__accordion-left">
                            <div className="template-builder__accordion-text">
                              <div className="template-builder__accordion-title-row">
                                <Typography className="template-builder__field-title">
                                  {field.label || `Campo ${index + 1}`}
                                </Typography>
                                <Chip
                                  label={
                                    FIELD_TYPES.find(
                                      (type) => type.value === field.type,
                                    )?.label
                                  }
                                  size="small"
                                />
                              </div>
                              <Typography variant="body2">
                                {field.campoId || "Identificador não definido"}
                              </Typography>
                            </div>
                          </div>
                          <IconButton
                            aria-label={`Remover ${field.label || `campo ${index + 1}`}`}
                            color="error"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeField(field.clientId);
                            }}
                          >
                            <Trash2 size={17} />
                          </IconButton>
                        </AccordionSummary>

                        <AccordionDetails className="template-builder__accordion-details">
                          {(fieldErrors[field.clientId]?.fieldKey ||
                            fieldErrors[field.clientId]?.type) && (
                            <Alert severity="error">
                              {[
                                fieldErrors[field.clientId]?.fieldKey,
                                fieldErrors[field.clientId]?.type,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </Alert>
                          )}
                          <div className="template-builder__field-grid">
                            <TextField
                              label="Rótulo"
                              value={field.label}
                              onChange={(event) => {
                                const label = event.target.value;
                                updateField(field.clientId, {
                                  label,
                                });
                              }}
                              error={Boolean(fieldErrors[field.clientId]?.label)}
                              helperText={fieldErrors[field.clientId]?.label}
                              required
                              fullWidth
                            />
                            <TextField
                              select
                              label="Tipo"
                              value={field.type}
                              onChange={(event) =>
                                updateField(field.clientId, {
                                  type: event.target.value as FieldType,
                                })
                              }
                              fullWidth
                            >
                              {FIELD_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              label="Posição"
                              type="number"
                              value={field.position}
                              onChange={(event) =>
                                updateField(field.clientId, {
                                  position: Number(event.target.value),
                                })
                              }
                              slotProps={{ htmlInput: { min: 1, step: 1 } }}
                              required
                              fullWidth
                            />
                            <TextField
                              label="Placeholder"
                              value={field.placeholder ?? ""}
                              onChange={(event) =>
                                updateField(field.clientId, {
                                  placeholder: event.target.value,
                                })
                              }
                              fullWidth
                            />
                            <TextField
                              label="Descrição"
                              value={field.description ?? ""}
                              onChange={(event) =>
                                updateField(field.clientId, {
                                  description: event.target.value,
                                })
                              }
                              fullWidth
                            />

                            {field.type === "select" && (
                              <div className="template-builder__options">
                                <Typography variant="subtitle2">
                                  Opções do select
                                </Typography>
                                {(field.options ?? []).map((option, optionIndex) => (
                                  <div
                                    className="template-builder__option-row"
                                    key={`${field.clientId}-${optionIndex}`}
                                  >
                                    <TextField
                                      label="Label"
                                      value={option.label}
                                      onChange={(event) =>
                                        updateOption(field.clientId, optionIndex, {
                                          label: event.target.value,
                                        })
                                      }
                                      required
                                      fullWidth
                                    />
                                    <TextField
                                      label="Value"
                                      value={option.value}
                                      onChange={(event) =>
                                        updateOption(field.clientId, optionIndex, {
                                          value: event.target.value,
                                        })
                                      }
                                      required
                                      fullWidth
                                    />
                                    <IconButton
                                      aria-label="Remover opção"
                                      color="error"
                                      onClick={() =>
                                        updateField(field.clientId, {
                                          options: field.options?.filter(
                                            (_, currentIndex) =>
                                              currentIndex !== optionIndex,
                                          ),
                                        })
                                      }
                                    >
                                      <Trash2 size={17} />
                                    </IconButton>
                                  </div>
                                ))}
                                <Button
                                  size="small"
                                  startIcon={<Plus size={16} />}
                                  onClick={() =>
                                    updateField(field.clientId, {
                                      options: [
                                        ...(field.options ?? []),
                                        { label: "", value: "" },
                                      ],
                                    })
                                  }
                                >
                                  Adicionar opção
                                </Button>
                              </div>
                            )}

                            <FormControlLabel
                              control={
                                <Switch
                                  checked={field.required}
                                  onChange={(event) =>
                                    updateField(field.clientId, {
                                      required: event.target.checked,
                                    })
                                  }
                                />
                              }
                              label="Campo obrigatório"
                            />
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="template-builder__preview-column">
          <Card className="template-builder__card" elevation={0}>
            <CardContent className="template-builder__card-content">
              <Typography variant="h6">Resumo</Typography>
              <Typography variant="body1">
                {template.name || "Template sem nome"}
              </Typography>
              <Typography variant="body2" className="template-builder__subtitle">
                {fields.length} {fields.length === 1 ? "campo" : "campos"}
              </Typography>
              <div>
                <TemplateStatusChip status={loadedTemplate?.status ?? "PENDENTE"} />
              </div>
              {[...fields]
                .sort((a, b) => a.position - b.position)
                .map((field) => (
                  <div key={field.clientId} className="template-builder__preview-field">
                    <Typography variant="body2" fontWeight={600}>
                      {field.position}. {field.label || "Campo sem rótulo"}
                      {field.required ? " *" : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.campoId || "sem_identificador"} • {field.type}
                    </Typography>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TemplateBuilderPage;
