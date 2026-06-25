import { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessage, ChatConversation } from "../types/chat";
import { chatService } from "../services/chat-service";

export function useChat(conversationId: string = "default-conv") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversation = useCallback(async () => {
    try {
      const conv = await chatService.getConversation(conversationId);
      if (conv.messages.length === 0) {
        // If empty, ensure we initialize it via service to save it
        await chatService.createConversation();
      }
      setMessages(conv.messages || []);
    } catch (err) {
      setError("Failed to load conversation");
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Optimistically add user message
    const tempId = Math.random().toString(36).substring(2, 9);
    const userMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    try {
      // Actually send via service (which saves user msg and generates AI response)
      const aiResponse = await chatService.sendMessage(conversationId, content);
      
      // Reload from service to get final state
      const conv = await chatService.getConversation(conversationId);
      setMessages(conv.messages);
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối với AI Coach.");
      // Revert status of last message to error
      setMessages((prev) => 
        prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m))
      );
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    await chatService.clearConversation(conversationId);
    setMessages([]);
  };

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearChat,
  };
}
