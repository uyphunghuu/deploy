import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ChatMessage as ChatMessageType } from "../../types/chat";
import { copy } from "../../lib/copy";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isTyping: boolean;
  onSelectPrompt: (prompt: string) => void;
}

export function ChatMessageList({ messages, isTyping, onSelectPrompt }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 flex flex-col">
      {isEmpty ? (
        <div className="flex flex-col flex-1">
          <div className="mt-8 mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Xin chào, {copy.demoName.split(" ")[0]}! 👋
            </h3>
            <p className="text-neutral-600 text-sm">
              Tôi là trợ lý AI Coach chạy bộ của bạn. Tôi có thể giúp bạn phân tích buổi chạy, khối lượng tập và gợi ý buổi chạy phù hợp.
            </p>
          </div>
          <SuggestedPrompts onSelect={onSelectPrompt} />
        </div>
      ) : (
        <div className="flex flex-col pb-2">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      )}
      <div ref={bottomRef} className="h-1 shrink-0" />
    </div>
  );
}
