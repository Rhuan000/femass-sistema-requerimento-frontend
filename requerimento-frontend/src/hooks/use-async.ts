import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../lib/api/http-client";

export function useAsync<T>(
  loader: () => Promise<T>,
  requestKey = "",
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const load = useCallback(async () => {
    void requestKey;
    setLoading(true);
    setError(null);

    try {
      setData(await loaderRef.current());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [requestKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
