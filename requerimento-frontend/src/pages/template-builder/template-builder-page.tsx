import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import {
  ChevronDown,
  FileText,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";

import { mockTemplates } from "../../lib/mock-data";
import {
  FIELD_TYPES,
  TEMPLATE_CATEGORIES,
  type FieldType,
  type FormField,
} from "../../lib/types";

import "./template-builder-styles.scss";

type BuilderTemplate = {
  id?: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
};

const fieldTypePlaceholders: Record<FieldType, string> = {
  text: "Digite um valor",
  textarea: "Escreva aqui",
  number: "0",
  date: "",
  select: "Selecione uma opção",
  checkbox: "",
  file: "",
  email: "usuario@exemplo.com",
};

const createFieldId = () =>
  `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const slugifyFieldName = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "_");

const createEmptyField = (): FormField => ({
  id: createFieldId(),
  name: "",
  label: "",
  type: "text",
  required: false,
  placeholder: fieldTypePlaceholders.text,
  description: "",
  options: undefined,
});

const createInitialTemplate = (templateId?: string): BuilderTemplate => {
  const template = mockTemplates.find((item) => item.id === templateId);

  if (!template) {
    return {
      name: "",
      description: "",
      category: TEMPLATE_CATEGORIES[0] ?? "Outros",
      fields: [],
    };
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    fields: template.fields.map((field) => ({
      ...field,
      options: field.options?.map((option) => ({ ...option })),
    })),
  };
};

function getFieldTypeLabel(type: FieldType) {
  return FIELD_TYPES.find((item) => item.value === type)?.label ?? type;
}

function TemplateBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [template, setTemplate] = useState<BuilderTemplate>(() =>
    createInitialTemplate(id)
  );
  const [expandedFieldId, setExpandedFieldId] = useState<string | false>(
    template.fields[0]?.id ?? false
  );

  const isEditing = Boolean(template.id);

  const previewFields = useMemo(() => template.fields, [template.fields]);

  const updateTemplate = (patch: Partial<BuilderTemplate>) => {
    setTemplate((current) => ({ ...current, ...patch }));
  };

  const updateField = (fieldId: string, patch: Partial<FormField>) => {
    setTemplate((current) => ({
      ...current,
      fields: current.fields.map((field) => {
        if (field.id !== fieldId) {
          return field;
        }

        const nextField = { ...field, ...patch };

        if (patch.type && patch.type !== "select") {
          nextField.options = undefined;
        }

        if (patch.type === "select" && !nextField.options?.length) {
          nextField.options = [
            { label: "Opção 1", value: "opcao_1" },
            { label: "Opção 2", value: "opcao_2" },
          ];
        }

        return nextField;
      }),
    }));
  };

  const handleAddField = () => {
    const newField = createEmptyField();

    setTemplate((current) => ({
      ...current,
      fields: [...current.fields, newField],
    }));
    setExpandedFieldId(newField.id);
  };

  const handleDeleteField = (fieldId: string) => {
    setTemplate((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.id !== fieldId),
    }));
    setExpandedFieldId((current) => (current === fieldId ? false : current));
  };

  const handleFieldLabelChange = (fieldId: string, label: string) => {
    updateField(fieldId, {
      label,
      name: slugifyFieldName(label),
    });
  };

  const handleFieldTypeChange = (fieldId: string, type: FieldType) => {
    updateField(fieldId, {
      type,
      placeholder: fieldTypePlaceholders[type],
      options:
        type === "select"
          ? [
              { label: "Opção 1", value: "opcao_1" },
              { label: "Opção 2", value: "opcao_2" },
            ]
          : undefined,
    });
  };

  const handleOptionsChange = (fieldId: string, value: string) => {
    const options = value
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean)
      .map((option) => ({
        label: option,
        value: slugifyFieldName(option),
      }));

    updateField(fieldId, {
      options,
    });
  };

  const handleSave = () => {
    console.log("Salvar template:", template);
    navigate("/templates");
  };

  return (
    <div className="template-builder">
      <div className="template-builder__topbar">
        <div className="template-builder__topbar-text">
          <Typography variant="h4" className="template-builder__title">
            {isEditing ? "Editar modelo" : "Novo modelo de requerimento"}
          </Typography>

          <Typography variant="body1" className="template-builder__subtitle">
            Configure os dados principais e os campos que aparecerão no
            formulário do aluno.
          </Typography>
        </div>

        <Button variant="contained" onClick={handleSave}>
          {isEditing ? "Salvar alterações" : "Salvar modelo"}
        </Button>
      </div>

      <div className="template-builder__layout">
        <div className="template-builder__main">
          <Card className="template-builder__card" elevation={0}>
            <CardContent className="template-builder__card-content">
              <Typography variant="h6">Informações gerais</Typography>

              <div className="template-builder__field-grid">
                <TextField
                  label="Nome do modelo"
                  value={template.name}
                  onChange={(event) =>
                    updateTemplate({ name: event.target.value })
                  }
                  fullWidth
                />

                <TextField
                  select
                  label="Categoria"
                  value={template.category}
                  onChange={(event) =>
                    updateTemplate({ category: event.target.value })
                  }
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
                    updateTemplate({ description: event.target.value })
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
                <div className="template-builder__topbar-text">
                  <Typography variant="h6">Campos do formulário</Typography>
                  <Typography
                    variant="body2"
                    className="template-builder__subtitle"
                  >
                    Defina a ordem, o tipo e as regras de preenchimento de cada
                    campo.
                  </Typography>
                </div>

                <Button
                  variant="outlined"
                  startIcon={<Plus size={18} />}
                  onClick={handleAddField}
                >
                  Adicionar campo
                </Button>
              </div>

              {template.fields.length === 0 ? (
                <div className="template-builder__empty-state">
                  <div className="template-builder__empty-icon">
                    <FileText size={28} />
                  </div>

                  <Typography
                    variant="h6"
                    className="template-builder__empty-title"
                  >
                    Nenhum campo configurado
                  </Typography>

                  <Typography
                    variant="body2"
                    className="template-builder__empty-subtitle"
                  >
                    Comece adicionando o primeiro campo do formulário.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={handleAddField}
                  >
                    Criar primeiro campo
                  </Button>
                </div>
              ) : (
                <div className="template-builder__fields">
                  {template.fields.map((field, index) => (
                    <Accordion
                      key={field.id}
                      expanded={expandedFieldId === field.id}
                      onChange={(_, expanded) =>
                        setExpandedFieldId(expanded ? field.id : false)
                      }
                      className="template-builder__accordion"
                      disableGutters
                      elevation={0}
                    >
                      <AccordionSummary
                        expandIcon={<ChevronDown size={18} />}
                        className="template-builder__accordion-summary"
                      >
                        <div className="template-builder__accordion-left">
                          <GripVertical
                            size={18}
                            className="template-builder__drag-icon"
                          />

                          <div className="template-builder__accordion-text">
                            <div className="template-builder__accordion-title-row">
                              <Typography
                                variant="body1"
                                className="template-builder__field-title"
                              >
                                {field.label || `Campo ${index + 1}`}
                              </Typography>

                              <Chip
                                label={getFieldTypeLabel(field.type)}
                                size="small"
                                variant="outlined"
                              />

                              {field.required && (
                                <Chip
                                  label="Obrigatório"
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              )}
                            </div>

                            <Typography
                              variant="body2"
                              className="template-builder__field-type"
                            >
                              {field.name || "Defina um identificador para o campo"}
                            </Typography>
                          </div>
                        </div>

                        <div className="template-builder__accordion-actions">
                          <IconButton
                            className="template-builder__delete-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteField(field.id);
                            }}
                            size="small"
                            aria-label={`Excluir campo ${field.label || index + 1}`}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </AccordionSummary>

                      <AccordionDetails className="template-builder__accordion-details">
                        <div className="template-builder__field-grid">
                          <TextField
                            label="Rótulo"
                            value={field.label}
                            onChange={(event) =>
                              handleFieldLabelChange(field.id, event.target.value)
                            }
                            fullWidth
                          />

                          <TextField
                            select
                            label="Tipo"
                            value={field.type}
                            onChange={(event) =>
                              handleFieldTypeChange(
                                field.id,
                                event.target.value as FieldType
                              )
                            }
                            fullWidth
                          >
                            {FIELD_TYPES.map((item) => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </TextField>

                          <TextField
                            label="Identificador"
                            value={field.name}
                            onChange={(event) =>
                              updateField(field.id, { name: event.target.value })
                            }
                            fullWidth
                          />

                          <TextField
                            label="Placeholder"
                            value={field.placeholder ?? ""}
                            onChange={(event) =>
                              updateField(field.id, {
                                placeholder: event.target.value,
                              })
                            }
                            disabled={field.type === "checkbox" || field.type === "file"}
                            fullWidth
                          />

                          <TextField
                            className="template-builder__field-grid-full"
                            label="Descrição de apoio"
                            value={field.description ?? ""}
                            onChange={(event) =>
                              updateField(field.id, {
                                description: event.target.value,
                              })
                            }
                            multiline
                            minRows={2}
                            fullWidth
                          />

                          {field.type === "select" && (
                            <TextField
                              className="template-builder__field-grid-full"
                              label="Opções"
                              helperText="Uma opção por linha"
                              value={
                                field.options?.map((option) => option.label).join("\n") ??
                                ""
                              }
                              onChange={(event) =>
                                handleOptionsChange(field.id, event.target.value)
                              }
                              multiline
                              minRows={4}
                              fullWidth
                            />
                          )}

                          <div className="template-builder__field-grid-full">
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={field.required}
                                  onChange={(event) =>
                                    updateField(field.id, {
                                      required: event.target.checked,
                                    })
                                  }
                                />
                              }
                              label="Campo obrigatório"
                            />
                          </div>
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="template-builder__preview-column">
          <Card className="template-builder__card" elevation={0}>
            <CardContent className="template-builder__card-content template-builder__preview-header">
              <Typography variant="h6">Pré-visualização</Typography>
            </CardContent>

            <CardContent className="template-builder__card-content">
              {previewFields.length === 0 ? (
                <Typography
                  variant="body2"
                  className="template-builder__preview-empty"
                >
                  O formulário aparecerá aqui assim que você criar campos.
                </Typography>
              ) : (
                <div className="template-builder__preview">
                  <div className="template-builder__preview-top">
                    <Typography
                      variant="h6"
                      className="template-builder__preview-title"
                    >
                      {template.name || "Novo modelo de requerimento"}
                    </Typography>

                    <Typography
                      variant="body2"
                      className="template-builder__preview-description"
                    >
                      {template.description || "Adicione uma descrição para orientar o aluno."}
                    </Typography>
                  </div>

                  <div className="template-builder__preview-fields">
                    {previewFields.map((field) => (
                      <div
                        key={field.id}
                        className="template-builder__preview-field"
                      >
                        <Typography
                          variant="body2"
                          className="template-builder__preview-label"
                        >
                          {field.label || "Campo sem título"}
                          {field.required && (
                            <span className="template-builder__required-mark">
                              *
                            </span>
                          )}
                        </Typography>

                        {field.description && (
                          <Typography
                            variant="caption"
                            className="template-builder__preview-field-description"
                          >
                            {field.description}
                          </Typography>
                        )}

                        {field.type === "textarea" ? (
                          <TextField
                            placeholder={field.placeholder}
                            multiline
                            minRows={3}
                            disabled
                            fullWidth
                          />
                        ) : field.type === "select" ? (
                          <TextField select disabled fullWidth value="">
                            <MenuItem value="">
                              {field.options?.[0]?.label ?? "Sem opções"}
                            </MenuItem>
                          </TextField>
                        ) : field.type === "checkbox" ? (
                          <FormControlLabel
                            control={<Switch disabled />}
                            label="Exemplo de marcação"
                          />
                        ) : (
                          <TextField
                            type={
                              field.type === "number" ||
                              field.type === "email" ||
                              field.type === "date"
                                ? field.type
                                : "text"
                            }
                            placeholder={field.placeholder}
                            disabled
                            fullWidth
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <Typography
                    variant="caption"
                    className="template-builder__preview-helper"
                  >
                    Visualização simplificada do formulário final.
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TemplateBuilderPage;
