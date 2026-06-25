import { apiRequest } from "@/services/apiClient";
import type {
  BackendActivity,
  BackendProfile,
  BackendProfileStatus,
  BackendRole,
  BackendTrainingPlan
} from "@/services/backendTypes";

export function listAdminProfiles(limit = 20, offset = 0): Promise<BackendProfile[]> {
  return apiRequest<BackendProfile[]>("/admin/profiles", {
    query: { limit, offset }
  });
}

export function updateAdminProfile(
  profileId: string,
  payload: { role?: BackendRole; status?: BackendProfileStatus }
): Promise<BackendProfile> {
  return apiRequest<BackendProfile, { role?: BackendRole; status?: BackendProfileStatus }>(
    `/admin/profiles/${profileId}`,
    {
      method: "PATCH",
      body: payload
    }
  );
}

export function listAdminTrainingPlans(limit = 20, offset = 0): Promise<BackendTrainingPlan[]> {
  return apiRequest<BackendTrainingPlan[]>("/admin/training-plans", {
    query: { limit, offset }
  });
}

export function listAdminActivities(limit = 20, offset = 0): Promise<BackendActivity[]> {
  return apiRequest<BackendActivity[]>("/admin/activities", {
    query: { limit, offset }
  });
}

