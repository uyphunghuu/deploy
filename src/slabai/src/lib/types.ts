export type Sport = "running" | "cycling" | "swimming";
export type IntegrationProvider = "garmin" | "strava" | "apple-health" | "coros";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  heightCm?: number;
  weightKg?: number;
  primarySport: Sport;
}

export interface Session {
  userId: string;
  authenticated: boolean;
  remember: boolean;
}

export interface RaceGoal {
  id: string;
  eventType: string;
  raceName: string;
  date: string;
  priority: "A" | "B" | "C";
}

export interface FitnessGoal {
  focus: "5k" | "10k" | "half-marathon" | "general-fitness" | "endurance";
  durationWeeks: number;
}

export interface Thresholds {
  heartRateBpm?: number;
  paceSecondsPerKm?: number;
  powerWatts?: number;
}

export interface PlanPreferences {
  sport: Sport;
  goalMode: "race" | "fitness";
  races: RaceGoal[];
  fitnessGoal?: FitnessGoal;
  volume: "low" | "mid" | "high";
  scheduleMode: "ai-optimized" | "custom";
  thresholds: Thresholds;
  buildProgression: "maintain" | "normal" | "aggressive";
}

export interface Workout {
  id: string;
  date: string;
  sport: Sport | "strength" | "rest";
  title: string;
  durationMinutes?: number;
  distanceKm?: number;
  intensity?: string;
  status: "planned" | "completed" | "skipped";
}

export interface CalendarPayload {
  range: {
    from: string;
    to: string;
  };
  workouts: Workout[];
}

export interface AthleteProfileMetrics {
  aerobicThresholdPace: string;
  thresholdPace: string;
  vo2MaxPace: string;
  sprintPace: string;
}

export interface InsightsPayload {
  sport: Sport;
  range: string;
  metrics: AthleteProfileMetrics;
  curve: Array<{ durationSeconds: number; paceSecondsPerKm: number }>;
}

export interface Integration {
  provider: IntegrationProvider;
  status: "connected" | "not-connected" | "connecting" | "error";
  permissions: string[];
  lastActivityAt?: string | null;
}

export interface CommunityActivity {
  id: string;
  athleteName: string;
  sport: Sport;
  title: string;
  description?: string;
  distanceKm?: number;
  pace?: string;
  durationSeconds?: number;
  routePoints: Array<{ x: number; y: number }>;
  occurredAt: string;
}

export interface CommunityPayload {
  profileSummary: {
    following: number;
    followers: number;
    activities: number;
    streakDays: number;
  };
  feed: CommunityActivity[];
  challenges: Array<{ id: string; title: string; progress: number; target: number }>;
  clubs: Array<{ id: string; name: string }>;
}

export interface BillingPayload {
  paymentMethods: Array<{ id: string; brand: string; last4: string }>;
  subscription: {
    status: "trial" | "active" | "past-due";
    plan: string;
    renewsAt: string | null;
  };
  invoices: Array<{ id: string; date: string; amount: string }>;
}
