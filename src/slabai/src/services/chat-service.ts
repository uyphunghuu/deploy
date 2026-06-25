import { ChatMessage, ChatConversation, ChatService } from "../types/chat";
import { mockResponses, defaultResponse } from "../mocks/chat-responses";

class MockChatService implements ChatService {
  private getStorageKey(conversationId: string) {
    return `slabai_chat_${conversationId}`;
  }

  private generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async createConversation(): Promise<ChatConversation> {
    const newConv: ChatConversation = {
      id: "default-conv", // For MVP, we'll just use one persistent conversation
      title: "Huấn luyện viên AI",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Check if exists
    const existing = localStorage.getItem(this.getStorageKey(newConv.id));
    if (!existing) {
      localStorage.setItem(this.getStorageKey(newConv.id), JSON.stringify(newConv));
    }
    
    return this.getConversation(newConv.id);
  }

  async getConversation(conversationId: string): Promise<ChatConversation> {
    const data = localStorage.getItem(this.getStorageKey(conversationId));
    if (data) {
      return JSON.parse(data);
    }
    
    return {
      id: conversationId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async sendMessage(conversationId: string, message: string): Promise<ChatMessage> {
    // 1. Save user message
    const conv = await this.getConversation(conversationId);
    
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    
    conv.messages.push(userMessage);
    conv.updatedAt = new Date().toISOString();
    localStorage.setItem(this.getStorageKey(conversationId), JSON.stringify(conv));

    // 2. Simulate network delay (600 - 1200ms)
    const delayTime = Math.floor(Math.random() * 600) + 600;
    await this.delay(delayTime);

    // 3. Generate AI response based on keywords
    const lowerMsg = message.toLowerCase();
    let aiResponseContent = defaultResponse;
    
    for (const item of mockResponses) {
      if (item.keywords.some((kw) => lowerMsg.includes(kw))) {
        aiResponseContent = item.response;
        break; // Match first relevant keyword
      }
    }

    const aiMessage: ChatMessage = {
      id: this.generateId(),
      role: "assistant",
      content: aiResponseContent,
      createdAt: new Date().toISOString(),
      status: "sent",
    };

    conv.messages.push(aiMessage);
    conv.updatedAt = new Date().toISOString();
    localStorage.setItem(this.getStorageKey(conversationId), JSON.stringify(conv));

    return aiMessage;
  }

  async clearConversation(conversationId: string): Promise<void> {
    localStorage.removeItem(this.getStorageKey(conversationId));
  }
}

export const chatService = new MockChatService();
