import { useCallback, useEffect, useState } from "react";
import { getParentAccounts } from "../api/parents.api";

export default function useParentAccounts({
  search = "",
  status = "Active",
  page = 1,
  pageSize = 8,
} = {}) {
  const [parents, setParents] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadParents = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const result = await getParentAccounts({
        search,
        status,
        page,
        pageSize,
        signal,
      });

      setParents(result.items || []);
      setTotal(result.total || 0);
      setCounts(result.counts || {});
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to load parents.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [search, status, page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();

    loadParents(controller.signal);

    return () => controller.abort();
  }, [loadParents]);

  return {
    parents,
    total,
    counts,
    loading,
    error,
    refresh: () => loadParents(),
  };
}