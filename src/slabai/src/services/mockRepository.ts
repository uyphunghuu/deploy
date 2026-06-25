import billingJson from "../../mock/billing.json";
import calendarJson from "../../mock/calendar.json";
import communityJson from "../../mock/community.json";
import insightsJson from "../../mock/insights.json";
import integrationsJson from "../../mock/integrations.json";
import planJson from "../../mock/plan-builder.json";
import userJson from "../../mock/user.json";
import { copy } from "@/lib/copy";
import type {
  BillingPayload,
  CalendarPayload,
  CommunityPayload,
  InsightsPayload,
  Integration,
  IntegrationProvider,
  PlanPreferences,
  Session,
  User,
  Workout
} from "@/lib/types";

const delay = (ms = 280) => new Promise((resolve) => window.setTimeout(resolve, ms));

const userFixture = userJson as unknown as User;
const planFixture = planJson as unknown as PlanPreferences;
const calendarFixture = calendarJson as unknown as CalendarPayload;
const communityFixture = communityJson as unknown as CommunityPayload;
const insightsFixture = insightsJson as unknown as InsightsPayload;
const integrationsFixture = integrationsJson as unknown as { items: Integration[] };
const billingFixture = billingJson as unknown as BillingPayload;

const sessionKey = "slabai-session";
const planKey = "slabai-plan-preferences";
const generatedPlanKey = "slabai-generated-plan";
const userKey = "slabai-user";

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
  await delay();
  if (!email.includes("@")) {
    throw new Error("Email không hợp lệ.");
  }
  return { requestId: `otp_${intent}_demo`, retryAfterSeconds: 60 };
}

export async function verifyCode(code: string, remember: boolean): Promise<Session> {
  await delay();
  if (code !== copy.otp) {
    throw new Error("Mã xác thực chưa đúng.");
  }
  const session: Session = { userId: userFixture.id, authenticated: true, remember };
  writeStorage(sessionKey, session);
  return session;
}

export function createMockSession(remember = true): Session {
  const session: Session = { userId: userFixture.id, authenticated: true, remember };
  writeStorage(sessionKey, session);
  return session;
}

export function getSession(): Session | null {
  return readStorage<Session | null>(sessionKey, null);
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(sessionKey);
  }
}

export async function getUser(): Promise<User> {
  await delay(180);
  return readStorage<User>(userKey, userFixture);
}

export async function saveUser(nextUser: User): Promise<User> {
  await delay(360);
  writeStorage(userKey, nextUser);
  return nextUser;
}

export async function getPlanPreferences(): Promise<PlanPreferences> {
  await delay(180);
  return readStorage<PlanPreferences>(planKey, planFixture);
}

export function readPlanPreferences(): PlanPreferences {
  return readStorage<PlanPreferences>(planKey, planFixture);
}

export async function savePlanPreferences(nextPlan: PlanPreferences): Promise<PlanPreferences> {
  await delay(220);
  writeStorage(planKey, nextPlan);
  return nextPlan;
}

export async function generatePlan(): Promise<{ planId: string; status: "generated"; calendarStart: string }> {
  await delay(700);
  const response = { planId: "plan_demo_01", status: "generated" as const, calendarStart: "2026-06-22" };
  writeStorage(generatedPlanKey, response);
  return response;
}

export async function getCalendar(): Promise<CalendarPayload> {
  await delay(260);
  const generated = readStorage<{ planId: string } | null>(generatedPlanKey, null);
  if (!generated) return calendarFixture;
  const extraWorkout: Workout = {
    id: "w_generated",
    date: "2026-06-29",
    sport: readPlanPreferences().sport,
    title: "Generated Plan Kickoff",
    durationMinutes: 35,
    intensity: "Zone 2",
    status: "planned"
  };
  return { ...calendarFixture, workouts: [...calendarFixture.workouts, extraWorkout] };
}

export async function getCommunity(): Promise<CommunityPayload> {
  await delay(260);
  return communityFixture;
}

export async function getInsights(): Promise<InsightsPayload> {
  await delay(260);
  return insightsFixture;
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
    { id: "getting-started", title: "Bắt đầu với SLABAI", count: 5 },
    { id: "training", title: "Kế hoạch tập luyện", count: 8 },
    { id: "devices", title: "Thiết bị & ứng dụng", count: 4 },
    { id: "billing", title: "Thanh toán", count: 3 }
  ];
}
