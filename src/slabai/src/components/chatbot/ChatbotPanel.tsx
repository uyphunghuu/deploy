import React, { useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { useChat } from "../../hooks/use-chat";
import { Button } from "../ui/Button";

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatbotPanel({ isOpen, onClose }: ChatbotPanelProps) {
  const { messages, isTyping, error, canRetry, sendMessage, clearChat, retryLastMessage } = useChat();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] flex flex-col bg-white shadow-2xl md:rounded-l-2xl border-l border-neutral-200 transform transition-transform duration-300 ease-in-out">
        <ChatHeader 
          onClose={onClose} 
          onNewChat={() => {
            if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện hiện tại và bắt đầu mới?")) {
              clearChat();
            }
          }} 
        />
        
        {/* Main chat area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {error && (
            <div className="absolute top-2 left-4 right-4 z-10 bg-status-error-50 border border-status-error-200 text-status-error-700 px-3 py-2 rounded-lg text-sm flex items-start justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="font-medium">Lỗi:</span>
                <span>{error}</span>
              </div>
              {canRetry && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={retryLastMessage}
                  disabled={isTyping}
                  className="h-7 shrink-0 rounded-md px-2 text-status-error-700 hover:text-status-error-800"
                >
                  Thử lại
                </Button>
              )}
            </div>
          )}
          
          <ChatMessageList 
            messages={messages} 
            isTyping={isTyping} 
            onSelectPrompt={(prompt) => sendMessage(prompt)} 
          />
        </div>
        
        <ChatComposer 
          onSend={sendMessage} 
          disabled={isTyping} 
        />
      </div>
    </>
  );
}
