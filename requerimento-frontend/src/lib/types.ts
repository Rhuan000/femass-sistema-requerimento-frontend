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
  campoId: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  position: number;
  options?: SelectOption[];
}

export type TemplateStatus =
  | "PENDENTE"
  | "EDITANDO"
  | "APROVADO"
  | "ATIVO"
  | "DESATIVADO";

export const TEMPLATE_STATUS_INFO: Record<
  TemplateStatus,
  {
    label: string;
    description: string;
    color: "warning" | "info" | "primary" | "success" | "default";
  }
> = {
  PENDENTE: {
    label: "Aguardando aprovação",
    description: "O template foi enviado e aguarda a decisão do diretor.",
    color: "warning",
  },
  EDITANDO: {
    label: "Em edição",
    description: "O template foi devolvido para ajustes antes de uma nova aprovação.",
    color: "info",
  },
  APROVADO: {
    label: "Aprovado",
    description: "O template foi aprovado e aguarda ativação pelo diretor.",
    color: "primary",
  },
  ATIVO: {
    label: "Ativo",
    description: "O template está disponível para preenchimento.",
    color: "success",
  },
  DESATIVADO: {
    label: "Desativado",
    description: "O template não está disponível para preenchimento.",
    color: "default",
  },
};

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  status: TemplateStatus;
  /** Derivado de status === "ATIVO". */
  active: boolean;
  fields: TemplateField[];
  /** Ações que o usuário atual pode executar, calculadas pelo backend. */
  approvalFlow?: ApprovalRule[];
  availableActions: TemplateAction[];
  createdAt?: string;
  updatedAt?: string;
}

/** Cada ação corresponde a um endpoint; "edit" é o PUT /templates/{id}. */
export type TemplateAction =
  | "edit"
  | "submit-approval"
  | "approve"
  | "return-for-editing"
  | "activate"
  | "deactivate";

export interface CurrentUser {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  papeis: string[];
  permissions: UserPermissions;
}

export interface UserPermissions {
  canCreateTemplate: boolean;
  canManageTemplates: boolean;
  canApproveTemplates: boolean;
  canCreateSubmission: boolean;
}

export interface TemplateInput {
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
  approvalFlow?: ApprovalRule[];
}

export interface ApprovalRule {
  label: string;
  role: string | null;
  userId: string | null;
  priority: number;
}

export interface ApprovalPerson { id: string; name: string; roles: string[] }
export interface ApprovalStep extends ApprovalRule {
  id: string; position: number; version: number; status: string;
  decidedAt?: string; decidedBy?: string; reason?: string;
}
export interface ApprovalFlow {
  steps: Array<{ step: ApprovalStep; responsibleName: string; canDecide: boolean; canReassign: boolean }>;
  history: Array<{ id: string; action: string; actorName: string; description: string; createdAt: string }>;
}
export interface ApprovalNotification {
  id: string; submissionId: string; templateId: string; message: string; createdAt: string; readAt?: string;
}

export interface Submission {
  id: string;
  templateId: string;
  templateName?: string;
  submittedBy: string;
  status: string;
  submittedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  data: Record<string, unknown>;
  answers: SubmissionAnswer[];
  documentos: SubmissionDocument[];
  /** Permissões do usuário atual neste requerimento, calculadas pelo backend. */
  canEdit: boolean;
  canSubmit: boolean;
}

export interface SubmissionDocument {
  id: string;
  submissionId: string;
  nomeOriginal: string;
  contentType: string;
  tamanho: number;
  createdAt: string;
}

export interface SubmissionAnswer {
  campoId: string;
  label: string;
  value: unknown;
}

export interface SubmissionInput {
  templateId: string;
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
