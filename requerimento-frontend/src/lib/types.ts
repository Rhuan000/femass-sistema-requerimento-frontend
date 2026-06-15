export type FieldType =
  | "text"
  | "email"
  | "number"
  | "date"
  | "select"
  | "textarea";

export interface SelectOption {
  label: string;
  value: string;
}

export interface TemplateField {
  id?: string;
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  position: number;
  options?: SelectOption[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
  fields: TemplateField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateInput {
  name: string;
  description: string;
  category: string;
  active: boolean;
  fields: TemplateField[];
}

export interface Submission {
  id: string;
  templateId: string;
  templateName?: string;
  submittedBy: string;
  status: string;
  submittedAt: string;
  data: Record<string, unknown>;
}

export interface SubmissionInput {
  templateId: string;
  submittedBy: string;
  data: Record<string, unknown>;
}

export const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "Texto curto" },
  { value: "email", label: "E-mail" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Seleção" },
  { value: "textarea", label: "Texto longo" },
];

export const TEMPLATE_CATEGORIES = [
  "Acadêmico",
  "Financeiro",
  "Documentos",
  "Estágio",
  "TCC",
  "Outros",
];
