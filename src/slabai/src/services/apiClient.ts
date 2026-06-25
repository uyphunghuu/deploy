import { getSupabaseClient } from "@/services/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw new ApiError(error.message, 401);
  const token = data.session?.access_token;
  if (!token) throw new ApiError("Authentication required.", 401);
  return token;
}

interface RequestOptions<Body> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Body;
  query?: Record<string, string | number | boolean | null | undefined>;
}

export async function apiRequest<Response, Body = unknown>(
  path: string,
  options: RequestOptions<Body> = {}
): Promise<Response> {
  const token = await getAccessToken();
  const url = new URL(`${API_PREFIX}${path}`, API_BASE_URL);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 204) return undefined as Response;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "API request failed.";
    throw new ApiError(detail, response.status);
  }

  return payload as Response;
}

