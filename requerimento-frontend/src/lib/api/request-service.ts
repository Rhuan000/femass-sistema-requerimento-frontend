import type {
  Submission,
  SubmissionDocument,
  SubmissionInput,
  Template,
  TemplateInput,
} from "../types";
import { apiRequest } from "./http-client";

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
    const nested = data.data ?? data.item ?? data.result;
    if (nested && typeof nested === "object") return nested as T;
  }
  return payload as T;
}

function normalizeTemplate(template: Template & { isActive?: boolean }): Template {
  return {
    ...template,
    active: template.active ?? template.isActive ?? true,
    fields: Array.isArray(template.fields)
      ? [...template.fields].sort((a, b) => a.position - b.position)
      : [],
  };
}

function normalizeSubmission(submission: Submission): Submission {
  const compatibleSubmission = submission as Submission & {
    createdAt?: string;
    submissionDate?: string;
  };

  return {
    ...submission,
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
      body: JSON.stringify(input),
    });
  },

  updateTemplate(id: string, input: TemplateInput) {
    return apiRequest<Template>(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  createSubmission(input: SubmissionInput) {
    return apiRequest<Submission>("/submissions", {
      method: "POST",
      body: JSON.stringify(input),
    });
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
