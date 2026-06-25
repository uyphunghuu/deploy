import { apiRequest } from "@/services/apiClient";
import type { BackendActivity } from "@/services/backendTypes";

export interface ActivityInput {
  sport: BackendActivity["sport"];
  title: string;
  description?: string | null;
  distance_km?: number | null;
  duration_seconds?: number | null;
  pace_seconds_per_km?: number | null;
  started_at: string;
  completed_at?: string | null;
  source?: string;
}

export function listActivities(limit = 20, offset = 0): Promise<BackendActivity[]> {
  return apiRequest<BackendActivity[]>("/activities", {
    query: { limit, offset }
  });
}

export function createActivity(payload: ActivityInput): Promise<BackendActivity> {
  return apiRequest<BackendActivity, ActivityInput>("/activities", {
    method: "POST",
    body: payload
  });
}

export function updateActivity(activityId: string, payload: Partial<ActivityInput>): Promise<BackendActivity> {
  return apiRequest<BackendActivity, Partial<ActivityInput>>(`/activities/${activityId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deleteActivity(activityId: string): Promise<void> {
  return apiRequest<void>(`/activities/${activityId}`, {
    method: "DELETE"
  });
}

