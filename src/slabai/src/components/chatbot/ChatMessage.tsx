import React from "react";
import { User, Bot, AlertCircle } from "lucide-react";
import { ChatMessage as ChatMessageType } from "../../types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-brand-blue-100 text-brand-blue-700" : "bg-brand-orange-100 text-brand-orange-600"}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isUser
                ? "bg-brand-blue-600 text-white rounded-br-sm"
                : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {/* Status & Time */}
          <div className="flex items-center gap-1 mt-1 text-[11px] text-neutral-500 px-1">
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isUser && message.status === "sending" && <span>• Đang gửi...</span>}
            {isUser && message.status === "error" && (
              <span className="text-status-error-500 flex items-center gap-1">
                <AlertCircle size={10} /> Lỗi
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
