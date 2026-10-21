import type {
  CurrentUser,
  Submission,
  SubmissionDocument,
  SubmissionInput,
  Template,
  TemplateAction,
  TemplateInput,
  TemplateField,
  TemplateStatus,
} from "../types";
import { apiDownload, apiRequest } from "./http-client";

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  const possibleList = data.content ?? data.items ?? data.data ?? data.results;
  return Array.isArray(possibleList) ? (possibleList as T[]) : [];
}

function unwrapObject<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.id === "string") return payload as T;
    const nested = data.data ?? data.item ?? data.result;
    if (nested && typeof nested === "object") return nested as T;
  }
  return payload as T;
}

type RawTemplate = Omit<Template, "status" | "active" | "availableActions"> & {
  status?: TemplateStatus;
  active?: boolean;
  isActive?: boolean;
  availableActions?: TemplateAction[];
};

/** O backend identifica cada campo por "fieldKey"; no front ele é o "campoId". */
function toTemplatePayload(input: TemplateInput) {
  return {
    ...input,
    fields: input.fields.map(({ campoId, ...field }) => ({
      ...field,
      fieldKey: campoId,
    })),
  };
}

function normalizeTemplate(template: RawTemplate): Template {
  const fields = Array.isArray(template.fields)
    ? template.fields.map((field, index) => {
        const rawField = field as TemplateField & {
          campo_id?: string;
          campoID?: string;
          fieldId?: string;
          fieldKey?: string;
          key?: string;
          code?: string;
          identifier?: string;
          campo?: {
            id?: string;
            campoId?: string;
            key?: string;
            code?: string;
          };
        };

        return {
          ...field,
          campoId:
            field.campoId ||
            rawField.campo_id ||
            rawField.campoID ||
            rawField.fieldId ||
            rawField.fieldKey ||
            rawField.key ||
            rawField.code ||
            rawField.identifier ||
            rawField.campo?.campoId ||
            rawField.campo?.key ||
            rawField.campo?.code ||
            rawField.campo?.id ||
            field.id ||
            `campo-${index + 1}`,
        };
      })
    : [];

  const status: TemplateStatus =
    template.status ??
    ((template.active ?? template.isActive) ? "ATIVO" : "DESATIVADO");

  return {
    ...template,
    status,
    active: status === "ATIVO",
    availableActions: template.availableActions ?? [],
    fields: fields.sort((a, b) => a.position - b.position),
  };
}

function normalizeSubmission(submission: Submission): Submission {
  const compatibleSubmission = submission as Submission & {
    createdAt?: string;
    submissionDate?: string;
  };
  const rawAnswers = submission.answers as
    | Array<SubmissionAnswerRaw>
    | undefined;

  return {
    ...submission,
    status: submission.status ?? "RASCUNHO",
    submittedAt:
      submission.submittedAt ??
      compatibleSubmission.createdAt ??
      compatibleSubmission.submissionDate ??
      "",
    data: submission.data ?? {},
    answers: rawAnswers
      ? rawAnswers.map((answer) => ({
          campoId: answer.campoId ?? answer.fieldKey ?? "",
          label: answer.label,
          value: answer.value,
        }))
      : Object.entries(submission.data ?? {}).map(([campoId, value]) => ({
          campoId,
          label: campoId,
          value,
        })),
    documentos: submission.documentos ?? [],
    canEdit: submission.canEdit ?? false,
    canSubmit: submission.canSubmit ?? false,
  };
}

type SubmissionAnswerRaw = {
  campoId?: string;
  fieldKey?: string;
  label: string;
  value: unknown;
};

export type TemplateStatusAction = Exclude<TemplateAction, "edit">;

export const requestService = {
  getCurrentUser() {
    return apiRequest<CurrentUser>("/me");
  },

  async listTemplates() {
    const payload = await apiRequest<unknown>("/templates");
    return unwrapList<RawTemplate>(payload).map(normalizeTemplate);
  },

  async listManagedTemplates() {
    const payload = await apiRequest<unknown>("/templates/management");
    return unwrapList<RawTemplate>(payload).map(normalizeTemplate);
  },

  async getTemplate(id: string) {
    const payload = await apiRequest<unknown>(`/templates/${id}`);
    return normalizeTemplate(unwrapObject<RawTemplate>(payload));
  },

  async changeTemplateStatus(id: string, action: TemplateStatusAction) {
    const payload = await apiRequest<unknown>(`/templates/${id}/${action}`, {
      method: "POST",
    });
    return normalizeTemplate(unwrapObject<RawTemplate>(payload));
  },

  async createTemplate(input: TemplateInput) {
    const payload = await apiRequest<unknown>("/templates", {
      method: "POST",
      body: JSON.stringify(toTemplatePayload(input)),
    });
    return normalizeTemplate(unwrapObject<RawTemplate>(payload));
  },

  async updateTemplate(id: string, input: TemplateInput) {
    const payload = await apiRequest<unknown>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(toTemplatePayload(input)),
    });
    return normalizeTemplate(unwrapObject<RawTemplate>(payload));
  },

  async createSubmission(input: SubmissionInput) {
    const payload = await apiRequest<unknown>("/submissions", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return normalizeSubmission(unwrapObject<Submission>(payload));
  },

  async getDraftByTemplate(templateId: string) {
    const payload = await apiRequest<unknown>(
      `/submissions/draft/template/${templateId}`,
    );
    return normalizeSubmission(unwrapObject<Submission>(payload));
  },

  async updateSubmission(id: string, data: Record<string, unknown>) {
    const payload = await apiRequest<unknown>(`/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ data }),
    });
    return normalizeSubmission(unwrapObject<Submission>(payload));
  },

  uploadDocument(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<SubmissionDocument>(`/submissions/${id}/documents`, {
      method: "POST",
      body: formData,
    });
  },

  deleteDocument(submissionId: string, documentId: string) {
    return apiRequest<void>(
      `/submissions/${submissionId}/documents/${documentId}`,
      { method: "DELETE" },
    );
  },

  downloadDocument(submissionId: string, documentId: string) {
    return apiDownload(
      `/submissions/${submissionId}/documents/${documentId}/download`,
    );
  },

  async submitSubmission(id: string) {
    const payload = await apiRequest<unknown>(`/submissions/${id}/submit`, {
      method: "POST",
    });
    return normalizeSubmission(unwrapObject<Submission>(payload));
  },

  async listSubmissionsByTemplate(templateId: string) {
    const payload = await apiRequest<unknown>(
      `/submissions/template/${templateId}`,
    );
    return unwrapList<Submission>(payload).map(normalizeSubmission);
  },

  async listSubmissions() {
    const payload = await apiRequest<unknown>("/submissions");
    return unwrapList<Submission>(payload).map(normalizeSubmission);
  },

  async getSubmission(id: string) {
    const payload = await apiRequest<unknown>(`/submissions/${id}`);
    return normalizeSubmission(unwrapObject<Submission>(payload));
  },
};
