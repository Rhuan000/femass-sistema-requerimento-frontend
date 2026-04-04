export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "file"
  | "email";

export type RequestStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected";

export interface SelectOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: SelectOption[];
}

export interface RequestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface RequestRecord {
  id: string;
  templateId: string;
  templateName: string;
  submittedBy: string;
  submittedAt: string;
  status: RequestStatus;
  data: Record<string, unknown>;
}

export const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "email", label: "E-mail" },
  { value: "select", label: "Seleção" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "Arquivo" },
];

export const TEMPLATE_CATEGORIES: string[] = [
  "Acadêmico",
  "Financeiro",
  "Documentos",
  "Estágio",
  "TCC",
  "Outros",
];