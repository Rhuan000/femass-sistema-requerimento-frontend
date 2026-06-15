import { requestService } from "../lib/api/request-service";
import { useAsync } from "./use-async";

export function useTemplates() {
  return useAsync(() => requestService.listTemplates());
}

export function useTemplate(id?: string) {
  return useAsync(
    () => {
      if (!id) return Promise.reject(new Error("Template não informado."));
      return requestService.getTemplate(id);
    },
    id,
  );
}
