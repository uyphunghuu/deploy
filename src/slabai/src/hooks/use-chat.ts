import { useState, useEffect, useCallback } from "react";
import { ChatMessage, ChatConversation } from "../types/chat";
import { ChatServiceError, chatService } from "../services/chat-service";

interface FailedMessage {
  content: string;
  messageId?: string;
}

export function useChat(initialConversationId?: string) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<FailedMessage | null>(null);

  const loadConversation = useCallback(async () => {
    try {
      const conv = initialConversationId
        ? await chatService.getConversation(initialConversationId)
        : await chatService.getActiveConversation();
      setConversationId(conv.id);
      setMessages(conv.messages || []);
    } catch (err) {
      setError("Không tải được cuộc trò chuyện.");
    }
  }, [initialConversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const sendMessage = async (content: string, options: { retryMessageId?: string } = {}) => {
    if (!content.trim()) return;

    const activeConversationId = conversationId ?? (await chatService.getActiveConversation()).id;
    if (!conversationId) setConversationId(activeConversationId);

    const tempId = options.retryMessageId ?? Math.random().toString(36).substring(2, 9);
    const userMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => {
      if (!options.retryMessageId) return [...prev, userMsg];
      return prev.map((message) =>
        message.id === options.retryMessageId ? { ...message, status: "sending" } : message
      );
    });
    setIsTyping(true);
    setError(null);
    setLastFailedMessage(null);

    try {
      await chatService.sendMessage(activeConversationId, content, options);
      const conv = await chatService.getConversation(activeConversationId);
      setMessages(conv.messages);
    } catch (err) {
      const chatError =
        err instanceof ChatServiceError
          ? err
          : new ChatServiceError("unknown", "Có lỗi xảy ra khi kết nối với AI Coach.");
      setError(chatError.userMessage);
      setLastFailedMessage({
        content,
        messageId: chatError.retryMessageId ?? options.retryMessageId ?? tempId
      });
      const conv = await chatService.getConversation(activeConversationId);
      if (conv.messages.length > 0) {
        setMessages(conv.messages);
        return;
      }
      setMessages((prev) => 
        prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m))
      );
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (conversationId) {
      await chatService.clearConversation(conversationId);
    }
    const conv = await chatService.createConversation();
    setConversationId(conv.id);
    setMessages(conv.messages);
    setError(null);
    setLastFailedMessage(null);
  };

  const retryLastMessage = async () => {
    if (!lastFailedMessage) return;
    await sendMessage(lastFailedMessage.content, { retryMessageId: lastFailedMessage.messageId });
  };

  return {
    conversationId,
    messages,
    isTyping,
    error,
    canRetry: Boolean(lastFailedMessage),
    sendMessage,
    clearChat,
    retryLastMessage,
  };
}
