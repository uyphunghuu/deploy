export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "error";
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatService {
  sendMessage(conversationId: string, message: string): Promise<ChatMessage>;
  createConversation(): Promise<ChatConversation>;
  getConversation(conversationId: string): Promise<ChatConversation>;
  clearConversation(conversationId: string): Promise<void>;
}
