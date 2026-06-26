export type ChatRole = "user" | "assistant" | "system";
export type ChatErrorCode =
  | "unauthenticated"
  | "session_expired"
  | "timeout"
  | "network"
  | "rate_limited"
  | "ai_not_configured"
  | "invalid_response"
  | "backend_unavailable"
  | "unknown";

export type AiCoachIntent =
  | "workout_advice"
  | "activity_analysis"
  | "plan_question"
  | "recovery"
  | "injury_risk"
  | "general_running"
  | "missing_context";

export type AiCoachPriority = "low" | "medium" | "high";
export type AiCoachWarningLevel = "none" | "caution" | "urgent";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "error";
  metadata?: {
    intent?: AiCoachIntent;
    summary?: string;
    warningLevel?: AiCoachWarningLevel;
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AiCoachRecommendation {
  title: string;
  details: string;
  priority: AiCoachPriority;
}

export interface AiCoachWarning {
  level: AiCoachWarningLevel;
  message: string;
}

export interface AiCoachChatResponse {
  response: string;
  recommendation: string;
  rationale: string;
  trace_enabled: boolean;
  answer: string;
  intent: AiCoachIntent;
  summary: string;
  recommendations: AiCoachRecommendation[];
  warning: AiCoachWarning;
  missing_data: string[];
  suggested_questions: string[];
}

export interface ChatService {
  sendMessage(conversationId: string, message: string, options?: { retryMessageId?: string }): Promise<ChatMessage>;
  createConversation(): Promise<ChatConversation>;
  getActiveConversation(): Promise<ChatConversation>;
  getConversation(conversationId: string): Promise<ChatConversation>;
  clearConversation(conversationId: string): Promise<void>;
}
