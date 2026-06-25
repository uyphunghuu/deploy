import { apiRequest } from "@/services/apiClient";
import type { BackendDashboardSummary } from "@/services/backendTypes";

export function getDashboardSummary(): Promise<BackendDashboardSummary> {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 7);
  const to = new Date(today);
  to.setDate(today.getDate() + 14);

  return apiRequest<BackendDashboardSummary>("/dashboard/summary", {
    query: {
      date_from: from.toISOString().slice(0, 10),
      date_to: to.toISOString().slice(0, 10)
    }
  });
}

