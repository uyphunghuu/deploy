import type { Sport } from "@/lib/types";

export type BackendRole = "USER" | "ADMIN";
export type BackendProfileStatus = "ACTIVE" | "SUSPENDED";
export type BackendGoalMode = "race" | "fitness";
export type BackendPlanStatus = "draft" | "generated" | "active" | "archived";
export type BackendSessionStatus = "planned" | "completed" | "skipped";

export interface BackendProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "prefer-not-to-say" | null;
  height_cm: number | null;
  weight_kg: number | null;
  primary_sport: Sport;
  role: BackendRole;
  status: BackendProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface BackendUserSport {
  id: string;
  user_id: string;
  sport: Sport;
  goal_mode: BackendGoalMode;
  fitness_focus: "5k" | "10k" | "half-marathon" | "general-fitness" | "endurance" | null;
  fitness_duration_weeks: number | null;
  race_goal: Record<string, unknown> | null;
  volume: "low" | "mid" | "high";
  schedule_mode: "ai-optimized" | "custom";
  heart_rate_bpm: number | null;
  pace_seconds_per_km: number | null;
  power_watts: number | null;
  build_progression: "maintain" | "normal" | "aggressive";
  created_at: string;
  updated_at: string;
}

export interface BackendActivity {
  id: string;
  user_id: string;
  sport: Sport | "strength" | "rest";
  title: string;
  description: string | null;
  distance_km: number | null;
  duration_seconds: number | null;
  pace_seconds_per_km: number | null;
  started_at: string;
  completed_at: string | null;
  source: string;
  external_id: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BackendTrainingPlan {
  id: string;
  user_id: string;
  name: string;
  sport: Sport;
  status: BackendPlanStatus;
  starts_on: string;
  ends_on: string | null;
  generated_by: string;
  generation_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BackendCalendarEvent {
  id: string;
  date: string;
  sport: Sport | "strength" | "rest";
  title: string;
  duration_minutes: number | null;
  distance_km: number | null;
  intensity: string | null;
  status: string;
  source: "training_session" | "activity";
}

export interface BackendCalendarResponse {
  range: {
    from: string;
    to: string;
  };
  events: BackendCalendarEvent[];
}

export interface BackendInsightsResponse {
  sport: Sport;
  range: string;
  metrics: {
    aerobicThresholdPace: string;
    thresholdPace: string;
    vo2MaxPace: string;
    sprintPace: string;
  };
  curve: Array<{ duration_seconds: number; pace_seconds_per_km: number }>;
}

export interface BackendDashboardSummary {
  activities_count: number;
  total_distance_km: number;
  total_duration_seconds: number;
  upcoming_sessions_count: number;
  active_plans_count: number;
}
