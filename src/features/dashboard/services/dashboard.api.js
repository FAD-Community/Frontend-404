
import { apiRequest } from "../../../api/apiClient";

export function getDashboardSummary(from, to) {
  const params = new URLSearchParams({
    From: from,
    To: to,
  });

  return apiRequest(`/dashboard/summary?${params.toString()}`);
}
