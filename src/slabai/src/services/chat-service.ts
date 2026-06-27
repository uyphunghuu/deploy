import { z } from "zod";
import { getSupabaseClient } from "./supabaseClient";
import type {
  AiCoachChatResponse,
  ChatConversation,
  ChatErrorCode,
  ChatMessage,
  ChatService
} from "../types/chat";
import { defaultResponse } from "../mocks/chat-responses";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const CHAT_ENDPOINT = "/api/v1/ai/coach/chat";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_CHAT_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARS = 8000;
const ACTIVE_CONVERSATION_KEY = "slabai_chat_active_conversation_id";
const CONVERSATION_IDS_KEY = "slabai_chat_conversation_ids";

const aiCoachResponseSchema = z.object({
  response: z.string(),
  recommendation: z.string(),
  rationale: z.string(),
  trace_enabled: z.boolean(),
  answer: z.string(),
  intent: z.enum([
    "workout_advice",
    "activity_analysis",
    "plan_question",
    "recovery",
    "injury_risk",
    "general_running",
    "missing_context"
  ]),
  summary: z.string(),
  recommendations: z.array(
    z.object({
      title: z.string(),
      details: z.string(),
      priority: z.enum(["low", "medium", "high"])
    })
  ),
  warning: z.object({
    level: z.enum(["none", "caution", "urgent"]),
    message: z.string()
  }),
  missing_data: z.array(z.string()),
  suggested_questions: z.array(z.string())
});

export class ChatServiceError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    readonly userMessage: string,
    readonly status?: number,
    readonly retryMessageId?: string
  ) {
    super(userMessage);
    this.name = "ChatServiceError";
  }
}

export class ApiChatService implements ChatService {
  async getActiveConversation(): Promise<ChatConversation> {
    const activeId = readString(ACTIVE_CONVERSATION_KEY);
    if (activeId) {
      const conversation = readConversation(activeId);
      if (conversation) return conversation;
    }
    return this.createConversation();
  }

  async createConversation(): Promise<ChatConversation> {
    const now = new Date().toISOString();
    const conversation: ChatConversation = {
      id: generateId(),
      title: "Huấn luyện viên AI",
      messages: [],
      createdAt: now,
      updatedAt: now
    };
    writeConversation(conversation);
    setActiveConversation(conversation.id);
    rememberConversationId(conversation.id);
    return conversation;
  }

  async getConversation(conversationId: string): Promise<ChatConversation> {
    const conversation = readConversation(conversationId);
    if (conversation) return conversation;

    const now = new Date().toISOString();
    return {
      id: conversationId,
      title: "Huấn luyện viên AI",
      messages: [],
      createdAt: now,
      updatedAt: now
    };
  }

  async sendMessage(
    conversationId: string,
    message: string,
    options: { retryMessageId?: string } = {}
  ): Promise<ChatMessage> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw new ChatServiceError("unknown", "Tin nhắn đang trống.");
    }

    const conversation = await this.getConversation(conversationId);
    const userMessage = upsertUserMessage(conversation, trimmed, options.retryMessageId);
    writeConversation(conversation);

    try {
      const response = await this.requestCoachResponse(conversation, userMessage);
      userMessage.status = "sent";

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: response.answer || response.response,
        createdAt: new Date().toISOString(),
        status: "sent",
        metadata: {
          intent: response.intent,
          summary: response.summary,
          warningLevel: response.warning.level
        }
      };

      conversation.messages.push(assistantMessage);
      conversation.updatedAt = assistantMessage.createdAt;
      if (conversation.messages.filter((item) => item.role === "user").length === 1) {
        conversation.title = trimmed.slice(0, 48) || "Huấn luyện viên AI";
      }
      writeConversation(conversation);
      return assistantMessage;
    } catch (error) {
      userMessage.status = "error";
      conversation.updatedAt = new Date().toISOString();
      writeConversation(conversation);
      throw toChatServiceError(error, userMessage.id);
    }
  }

  async clearConversation(conversationId: string): Promise<void> {
    removeConversation(conversationId);
  }

  private async requestCoachResponse(
    conversation: ChatConversation,
    userMessage: ChatMessage
  ): Promise<AiCoachChatResponse> {
    const token = await getAccessToken();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(new URL(CHAT_ENDPOINT, API_BASE_URL), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation_id: conversation.id,
          message: userMessage.content,
          history: recentHistory(conversation, userMessage.id)
        }),
        signal: controller.signal
      });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw errorForStatus(response.status, payload);
      }

      const parsed = aiCoachResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new ChatServiceError(
          "invalid_response",
          "AI Coach trả về dữ liệu chưa đúng định dạng. Vui lòng thử lại.",
          response.status
        );
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ChatServiceError("timeout", "AI Coach phản hồi quá lâu. Vui lòng thử lại sau.");
      }
      if (error instanceof TypeError) {
        throw new ChatServiceError("network", "Không kết nối được tới máy chủ. Hãy kiểm tra mạng rồi thử lại.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

export class MockChatService extends ApiChatService {
  async sendMessage(
    conversationId: string,
    message: string,
    options: { retryMessageId?: string } = {}
  ): Promise<ChatMessage> {
    const conversation = await this.getConversation(conversationId);
    const userMessage = upsertUserMessage(conversation, message.trim(), options.retryMessageId);
    writeConversation(conversation);
    await delay(400);

    userMessage.status = "sent";
    const assistantMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: defaultResponse,
      createdAt: new Date().toISOString(),
      status: "sent",
      metadata: {
        intent: "general_running",
        summary: "Mock response for local development.",
        warningLevel: "none"
      }
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = assistantMessage.createdAt;
    writeConversation(conversation);
    return assistantMessage;
  }
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw new ChatServiceError("session_expired", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
  }
  const token = data.session?.access_token;
  if (!token) {
    throw new ChatServiceError("unauthenticated", "Bạn cần đăng nhập để sử dụng AI Coach.", 401);
  }
  return token;
}

function errorForStatus(status: number, payload: unknown): ChatServiceError {
  const detail = getBackendDetail(payload).toLowerCase();
  if (status === 401) {
    return new ChatServiceError("session_expired", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", status);
  }
  if (status === 429) {
    return new ChatServiceError("rate_limited", "Bạn đang gửi hơi nhanh. Vui lòng chờ một chút rồi thử lại.", status);
  }
  if (status === 408 || status === 504) {
    return new ChatServiceError("timeout", "AI Coach phản hồi quá lâu. Vui lòng thử lại sau.", status);
  }
  if (status === 503 && (detail.includes("not configured") || detail.includes("llm_model"))) {
    return new ChatServiceError("ai_not_configured", "AI Coach chưa được cấu hình trên máy chủ.", status);
  }
  if (status >= 500) {
    return new ChatServiceError("backend_unavailable", "AI Coach đang tạm thời không khả dụng. Vui lòng thử lại.", status);
  }
  return new ChatServiceError("unknown", "Không gửi được tin nhắn. Vui lòng thử lại.", status);
}

function toChatServiceError(error: unknown, retryMessageId: string): ChatServiceError {
  if (error instanceof ChatServiceError) {
    return new ChatServiceError(error.code, error.userMessage, error.status, retryMessageId);
  }
  return new ChatServiceError("unknown", "Không gửi được tin nhắn. Vui lòng thử lại.", undefined, retryMessageId);
}

function getBackendDetail(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    return typeof detail === "string" ? detail : "";
  }
  return "";
}

function upsertUserMessage(
  conversation: ChatConversation,
  content: string,
  retryMessageId?: string
): ChatMessage {
  const now = new Date().toISOString();
  const existing = retryMessageId
    ? conversation.messages.find((item) => item.id === retryMessageId && item.role === "user")
    : undefined;

  if (existing) {
    existing.content = content;
    existing.status = "sending";
    conversation.updatedAt = now;
    return existing;
  }

  const userMessage: ChatMessage = {
    id: generateId(),
    role: "user",
    content,
    createdAt: now,
    status: "sending"
  };
  conversation.messages.push(userMessage);
  conversation.updatedAt = now;
  return userMessage;
}

function recentHistory(conversation: ChatConversation, currentMessageId: string) {
  const history = conversation.messages
    .filter(
      (message) =>
        message.id !== currentMessageId &&
        message.status !== "error" &&
        (message.role === "user" || message.role === "assistant")
    )
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_CHAT_MESSAGE_CHARS)
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);

  let totalChars = history.reduce((total, message) => total + message.content.length, 0);
  while (history.length > 0 && totalChars > MAX_HISTORY_CHARS) {
    const removed = history.shift();
    totalChars -= removed?.content.length ?? 0;
  }
  return history;
}

function readConversation(conversationId: string): ChatConversation | null {
  const raw = readString(storageKey(conversationId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ChatConversation>;
    if (!parsed.id || !Array.isArray(parsed.messages)) return null;
    return {
      id: parsed.id,
      title: parsed.title ?? "Huấn luyện viên AI",
      messages: parsed.messages.filter(isChatMessage),
      createdAt: parsed.createdAt ?? new Date().toISOString(),
      updatedAt: parsed.updatedAt ?? new Date().toISOString()
    };
  } catch {
    return null;
  }
}

function writeConversation(conversation: ChatConversation): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(conversation.id), JSON.stringify(conversation));
  setActiveConversation(conversation.id);
  rememberConversationId(conversation.id);
}

function removeConversation(conversationId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(conversationId));
  if (readString(ACTIVE_CONVERSATION_KEY) === conversationId) {
    window.localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }
  const ids = readConversationIds().filter((id) => id !== conversationId);
  window.localStorage.setItem(CONVERSATION_IDS_KEY, JSON.stringify(ids));
}

function rememberConversationId(conversationId: string): void {
  if (typeof window === "undefined") return;
  const ids = readConversationIds();
  if (!ids.includes(conversationId)) {
    window.localStorage.setItem(CONVERSATION_IDS_KEY, JSON.stringify([...ids, conversationId]));
  }
}

function readConversationIds(): string[] {
  const raw = readString(CONVERSATION_IDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function setActiveConversation(conversationId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId);
}

function readString(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function storageKey(conversationId: string): string {
  return `slabai_chat_${conversationId}`;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant" || message.role === "system") &&
    typeof message.content === "string" &&
    typeof message.createdAt === "string"
  );
}

function generateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export const chatService: ChatService =
  process.env.NEXT_PUBLIC_USE_MOCK_CHAT === "true" ? new MockChatService() : new ApiChatService();
