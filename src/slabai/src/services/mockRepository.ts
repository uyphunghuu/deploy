import billingJson from "../../mock/billing.json";
import communityJson from "../../mock/community.json";
import integrationsJson from "../../mock/integrations.json";
import planJson from "../../mock/plan-builder.json";
import { apiRequest } from "@/services/apiClient";
import type {
  BackendCalendarResponse,
  BackendInsightsResponse,
  BackendProfile,
  BackendTrainingPlan,
  BackendUserSport
} from "@/services/backendTypes";
import { getSupabaseClient } from "@/services/supabaseClient";
import type {
  BillingPayload,
  CalendarPayload,
  CommunityPayload,
  InsightsPayload,
  Integration,
  IntegrationProvider,
  PlanPreferences,
  Session,
  User
} from "@/lib/types";

const delay = (ms = 280) => new Promise((resolve) => window.setTimeout(resolve, ms));

const planFixture = planJson as unknown as PlanPreferences;
const communityFixture = communityJson as unknown as CommunityPayload;
const integrationsFixture = integrationsJson as unknown as { items: Integration[] };
const billingFixture = billingJson as unknown as BillingPayload;

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function requestCode(email: string, intent: "register" | "login") {
  const { error } = await getSupabaseClient().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: intent === "register"
    }
  });
  if (error) throw new Error(error.message);
  return { requestId: `otp_${intent}_supabase`, retryAfterSeconds: 60 };
}

export async function verifyCode(code: string, remember: boolean): Promise<Session> {
  const email = window.sessionStorage.getItem("slabai-otp-email");
  if (!email) throw new Error("Email xac thuc khong ton tai.");

  const { data, error } = await getSupabaseClient().auth.verifyOtp({
    email,
    token: code,
    type: "email"
  });
  if (error) throw new Error(error.message);

  return { userId: data.user?.id ?? "", authenticated: Boolean(data.session), remember };
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/calendar` : undefined;
  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo }
  });
  if (error) throw new Error(error.message);
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error || !data.session?.user) return null;
  return { userId: data.session.user.id, authenticated: true, remember: true };
}

export async function clearSession(): Promise<void> {
  await getSupabaseClient().auth.signOut();
}

export async function getUser(): Promise<User> {
  return toUser(await apiRequest<BackendProfile>("/profile"));
}

export async function saveUser(nextUser: User): Promise<User> {
  const profile = await apiRequest<BackendProfile, Partial<BackendProfile>>("/profile", {
    method: "PATCH",
    body: {
      first_name: nextUser.firstName,
      last_name: nextUser.lastName,
      avatar_url: nextUser.avatarUrl ?? null,
      date_of_birth: nextUser.dateOfBirth,
      gender: nextUser.gender,
      height_cm: nextUser.heightCm,
      weight_kg: nextUser.weightKg,
      primary_sport: nextUser.primarySport
    }
  });
  return toUser(profile);
}

export async function getPlanPreferences(): Promise<PlanPreferences> {
  const sports = await apiRequest<BackendUserSport[]>("/profile/sports");
  return sports[0] ? toPlanPreferences(sports[0]) : planFixture;
}

export function readPlanPreferences(): PlanPreferences {
  return planFixture;
}

export async function savePlanPreferences(nextPlan: PlanPreferences): Promise<PlanPreferences> {
  const saved = await apiRequest<BackendUserSport, ReturnType<typeof toUserSportPayload>>("/profile/sports", {
    method: "PUT",
    body: toUserSportPayload(nextPlan)
  });
  return toPlanPreferences(saved);
}

export async function generatePlan(): Promise<{ planId: string; status: "generated"; calendarStart: string }> {
  const preferences = await getPlanPreferences();
  const plan = await apiRequest<BackendTrainingPlan, { sport: string; starts_on: string; name: string }>(
    "/training/plans/generate",
    {
      method: "POST",
      body: {
        sport: preferences.sport,
        starts_on: new Date().toISOString().slice(0, 10),
        name: "SLABAI Generated Plan"
      }
    }
  );
  return { planId: plan.id, status: "generated", calendarStart: plan.starts_on };
}

export async function getCalendar(): Promise<CalendarPayload> {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 14);
  const to = new Date(today);
  to.setDate(today.getDate() + 28);

  const payload = await apiRequest<BackendCalendarResponse>("/calendar", {
    query: {
      date_from: from.toISOString().slice(0, 10),
      date_to: to.toISOString().slice(0, 10)
    }
  });

  return {
    range: payload.range,
    workouts: payload.events.map((event) => ({
      id: event.id,
      date: event.date,
      sport: event.sport,
      title: event.title,
      durationMinutes: event.duration_minutes ?? undefined,
      distanceKm: event.distance_km ?? undefined,
      intensity: event.intensity ?? undefined,
      status: event.status === "completed" || event.status === "skipped" ? event.status : "planned"
    }))
  };
}

export async function getCommunity(): Promise<CommunityPayload> {
  await delay(260);
  return communityFixture;
}

export async function getInsights(): Promise<InsightsPayload> {
  const payload = await apiRequest<BackendInsightsResponse>("/insights/profiles-zones", {
    query: { sport: "running", range_key: "6w" }
  });
  return {
    sport: payload.sport,
    range: payload.range,
    metrics: payload.metrics,
    curve: payload.curve.map((point) => ({
      durationSeconds: point.duration_seconds,
      paceSecondsPerKm: point.pace_seconds_per_km
    }))
  };
}

export async function getIntegrations(): Promise<Integration[]> {
  await delay(260);
  return readStorage<Integration[]>("slabai-integrations", integrationsFixture.items);
}

export async function setIntegrationStatus(
  provider: IntegrationProvider,
  status: Integration["status"]
): Promise<Integration[]> {
  const integrations = await getIntegrations();
  const next = integrations.map((item) =>
    item.provider === provider ? { ...item, status, lastActivityAt: new Date().toISOString() } : item
  );
  writeStorage("slabai-integrations", next);
  return next;
}

export async function getBilling(): Promise<BillingPayload> {
  await delay(260);
  return readStorage<BillingPayload>("slabai-billing", billingFixture);
}

export async function addMockPaymentMethod(): Promise<BillingPayload> {
  await delay(360);
  const next: BillingPayload = {
    ...billingFixture,
    paymentMethods: [{ id: "pm_demo", brand: "Visa", last4: "4242" }]
  };
  writeStorage("slabai-billing", next);
  return next;
}

export async function getHelpCategories() {
  await delay(180);
  return [
    { id: "getting-started", title: "Bat dau voi SLABAI", count: 5 },
    { id: "training", title: "Ke hoach tap luyen", count: 8 },
    { id: "devices", title: "Thiet bi & ung dung", count: 4 },
    { id: "billing", title: "Thanh toan", count: 3 }
  ];
}

function toUser(profile: BackendProfile): User {
  return {
    id: profile.id,
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    email: profile.email,
    avatarUrl: profile.avatar_url,
    dateOfBirth: profile.date_of_birth ?? undefined,
    gender: profile.gender ?? undefined,
    heightCm: profile.height_cm ?? undefined,
    weightKg: profile.weight_kg ?? undefined,
    primarySport: profile.primary_sport
  };
}

function toPlanPreferences(sport: BackendUserSport): PlanPreferences {
  return {
    sport: sport.sport,
    goalMode: sport.goal_mode,
    races: sport.race_goal ? [{ id: sport.id, ...sport.race_goal } as PlanPreferences["races"][number]] : [],
    fitnessGoal: {
      focus: sport.fitness_focus ?? "5k",
      durationWeeks: sport.fitness_duration_weeks ?? 6
    },
    volume: sport.volume,
    scheduleMode: sport.schedule_mode,
    thresholds: {
      heartRateBpm: sport.heart_rate_bpm ?? undefined,
      paceSecondsPerKm: sport.pace_seconds_per_km ?? undefined,
      powerWatts: sport.power_watts ?? undefined
    },
    buildProgression: sport.build_progression
  };
}

function toUserSportPayload(plan: PlanPreferences) {
  return {
    sport: plan.sport,
    goal_mode: plan.goalMode,
    fitness_focus: plan.fitnessGoal?.focus ?? null,
    fitness_duration_weeks: plan.fitnessGoal?.durationWeeks ?? null,
    race_goal: plan.races[0] ?? null,
    volume: plan.volume,
    schedule_mode: plan.scheduleMode,
    heart_rate_bpm: plan.thresholds.heartRateBpm ?? null,
    pace_seconds_per_km: plan.thresholds.paceSecondsPerKm ?? null,
    power_watts: plan.thresholds.powerWatts ?? null,
    build_progression: plan.buildProgression
  };
}
