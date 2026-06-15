import { useEffect, useMemo, useState } from "react";
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
import { useAsync } from "../../hooks/use-async";
import { getErrorMessage } from "../../lib/api/http-client";
import { requestService } from "../../lib/api/request-service";
import {
  FIELD_TYPES,
  TEMPLATE_CATEGORIES,
  type FieldType,
  type SelectOption,
  type TemplateField,
  type TemplateInput,
} from "../../lib/types";
import "./template-builder-styles.scss";

interface EditableField extends TemplateField {
  clientId: string;
}

const FIELD_KEY_PATTERN = /^[a-z0-9_]+$/;

const createClientId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createField = (position: number): EditableField => ({
  clientId: createClientId(),
  fieldKey: "",
  label: "",
  type: "text",
  required: false,
  placeholder: "",
  description: "",
  position,
  options: undefined,
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function TemplateBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
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
    active: true,
    fields: [],
  });
  const [fields, setFields] = useState<EditableField[]>([]);
  const [initializedId, setInitializedId] = useState<string | null | undefined>(
    undefined,
  );
  const [expandedId, setExpandedId] = useState<string | false>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading || initializedId === (id ?? null)) return;

    if (loadedTemplate) {
      setTemplate({
        name: loadedTemplate.name,
        description: loadedTemplate.description,
        category: loadedTemplate.category,
        active: loadedTemplate.active,
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

  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    fields.forEach((field) => {
      if (field.fieldKey) {
        counts.set(field.fieldKey, (counts.get(field.fieldKey) ?? 0) + 1);
      }
    });
    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([fieldKey]) => fieldKey),
    );
  }, [fields]);

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

  const validate = () => {
    if (!template.name.trim()) return "Informe o nome do template.";
    if (!template.category.trim()) return "Informe a categoria.";
    if (fields.length === 0) return "Adicione pelo menos um campo.";

    for (const field of fields) {
      if (!field.label.trim()) return "Todos os campos precisam de um rótulo.";
      if (!FIELD_KEY_PATTERN.test(field.fieldKey)) {
        return `A chave "${field.fieldKey || "(vazia)"}" deve conter apenas letras minúsculas, números e _.`;
      }
      if (duplicateKeys.has(field.fieldKey)) {
        return `A chave "${field.fieldKey}" está duplicada.`;
      }
      if (!Number.isInteger(field.position) || field.position < 1) {
        return `A posição do campo "${field.label}" deve ser um inteiro positivo.`;
      }
      if (
        field.type === "select" &&
        (!field.options?.length ||
          field.options.some(
            (option) => !option.label.trim() || !option.value.trim(),
          ))
      ) {
        return `Preencha o label e o value de todas as opções de "${field.label}".`;
      }
    }

    const positions = fields.map((field) => field.position);
    if (new Set(positions).size !== positions.length) {
      return "As posições dos campos não podem se repetir.";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaving(true);
    setSaveError(null);

    const payload: TemplateInput = {
      ...template,
      name: template.name.trim(),
      description: template.description.trim(),
      category: template.category.trim(),
      fields: fields
        .map((field) => ({
          id: field.id,
          fieldKey: field.fieldKey,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          description: field.description,
          position: field.position,
          options: field.type === "select" ? field.options : undefined,
        }))
        .sort((a, b) => a.position - b.position),
    };

    try {
      if (id) await requestService.updateTemplate(id, payload);
      else await requestService.createTemplate(payload);
      navigate("/templates");
    } catch (requestError) {
      setSaveError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

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
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar template"}
        </Button>
      </div>

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
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.active}
                      onChange={(event) =>
                        setTemplate((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                    />
                  }
                  label="Template ativo"
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
                    const invalidKey =
                      Boolean(field.fieldKey) &&
                      !FIELD_KEY_PATTERN.test(field.fieldKey);
                    const duplicateKey = duplicateKeys.has(field.fieldKey);

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
                                {field.fieldKey || "Chave não definida"}
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
                          <div className="template-builder__field-grid">
                            <TextField
                              label="Rótulo"
                              value={field.label}
                              onChange={(event) => {
                                const label = event.target.value;
                                updateField(field.clientId, {
                                  label,
                                  ...(!field.fieldKey
                                    ? { fieldKey: slugify(label) }
                                    : {}),
                                });
                              }}
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
                              label="fieldKey"
                              value={field.fieldKey}
                              onChange={(event) =>
                                updateField(field.clientId, {
                                  fieldKey: event.target.value,
                                })
                              }
                              error={invalidKey || duplicateKey}
                              helperText={
                                duplicateKey
                                  ? "Chave duplicada"
                                  : invalidKey
                                    ? "Use apenas a-z, 0-9 e _"
                                    : "Ex.: motivo_solicitacao"
                              }
                              required
                              fullWidth
                            />
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
                {fields.length} {fields.length === 1 ? "campo" : "campos"} •{" "}
                {template.active ? "Ativo" : "Inativo"}
              </Typography>
              {[...fields]
                .sort((a, b) => a.position - b.position)
                .map((field) => (
                  <div key={field.clientId} className="template-builder__preview-field">
                    <Typography variant="body2" fontWeight={600}>
                      {field.position}. {field.label || "Campo sem rótulo"}
                      {field.required ? " *" : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {field.fieldKey || "sem_chave"} • {field.type}
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
