const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    "VITE_API_URL não foi definida. Configure a URL da API no arquivo .env.",
  );
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const possibleMessage = data.message ?? data.error ?? data.detail ?? data.title;

    if (typeof possibleMessage === "string" && possibleMessage.trim()) {
      return possibleMessage;
    }

    if (Array.isArray(data.errors)) {
      const messages = data.errors
        .map((error) => {
          if (typeof error === "string") return error;
          if (error && typeof error === "object") {
            const item = error as Record<string, unknown>;
            return item.message ?? item.defaultMessage;
          }
          return null;
        })
        .filter((message): message is string => typeof message === "string");

      if (messages.length) return messages.join(" ");
    }
  }

  return fallback;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 204) return undefined;
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o servidor está disponível.",
      0,
    );
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(
        payload,
        `A API retornou o status ${response.status}. Tente novamente.`,
      ),
      response.status,
    );
  }

  return payload as T;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Ocorreu um erro inesperado. Tente novamente.";
}
