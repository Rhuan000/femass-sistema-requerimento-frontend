import type {
  Submission,
  SubmissionDocument,
  SubmissionInput,
  Template,
  TemplateInput,
  TemplateField,
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

function normalizeTemplate(template: Template & { isActive?: boolean }): Template {
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

  return {
    ...template,
    active: template.active ?? template.isActive ?? true,
    fields: fields.sort((a, b) => a.position - b.position),
  };
}

function normalizeSubmission(submission: Submission): Submission {
  const compatibleSubmission = submission as Submission & {
    createdAt?: string;
    submissionDate?: string;
  };

  return {
    ...submission,
    status: submission.status ?? "RASCUNHO",
    submittedAt:
      submission.submittedAt ??
      compatibleSubmission.createdAt ??
      compatibleSubmission.submissionDate ??
      "",
    data: submission.data ?? {},
    answers:
      submission.answers ??
      Object.entries(submission.data ?? {}).map(([campoId, value]) => ({
        campoId,
        label: campoId,
        value,
      })),
    documentos: submission.documentos ?? [],
  };
}

function serializeTemplate(input: TemplateInput) {
  const fieldKeys = new Set<string>();
  const fields = input.fields.map((field, index) => {
    const fieldKey = field.campoId?.trim();
    if (!fieldKey) {
      throw new Error(`O campo ${index + 1} precisa de um identificador válido.`);
    }
    if (fieldKeys.has(fieldKey)) {
      throw new Error(`O identificador "${fieldKey}" está duplicado.`);
    }
    fieldKeys.add(fieldKey);
    return { ...field, campoId: fieldKey, fieldKey };
  });
  return { ...input, fields };
}

export const requestService = {
  async listTemplates() {
    const payload = await apiRequest<unknown>("/templates");
    return unwrapList<Template & { isActive?: boolean }>(payload).map(
      normalizeTemplate,
    );
  },

  async getTemplate(id: string) {
    const payload = await apiRequest<unknown>(`/templates/${id}`);
    return normalizeTemplate(
      unwrapObject<Template & { isActive?: boolean }>(payload),
    );
  },

  createTemplate(input: TemplateInput) {
    return apiRequest<Template>("/templates", {
      method: "POST",
      body: JSON.stringify(serializeTemplate(input)),
    });
  },

  updateTemplate(id: string, input: TemplateInput) {
    return apiRequest<Template>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(serializeTemplate(input)),
    });
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

  updateSubmission(id: string, data: Record<string, unknown>) {
    return apiRequest<Submission>(`/submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ data }),
    });
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

  submitSubmission(id: string) {
    return apiRequest<Pick<Submission, "id" | "status" | "submittedAt">>(
      `/submissions/${id}/submit`,
      { method: "POST" },
    );
  },

  async listSubmissionsByTemplate(templateId: string) {
    const payload = await apiRequest<unknown>(
      `/submissions/template/${templateId}`,
    );
    return unwrapList<Submission>(payload).map(normalizeSubmission);
  },

  async getSubmission(id: string) {
    const payload = await apiRequest<unknown>(`/submissions/${id}`);
    return normalizeSubmission(unwrapObject<Submission>(payload));
  },
};
