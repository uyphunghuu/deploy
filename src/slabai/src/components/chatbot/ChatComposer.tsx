import React, { useState, useRef, KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "../ui/Button";

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-4 border-t border-neutral-200 bg-white">
      <div className="flex items-end gap-2 bg-neutral-50 border border-neutral-300 rounded-xl p-2 focus-within:border-brand-blue-500 focus-within:ring-1 focus-within:ring-brand-blue-500 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi AI Coach về kế hoạch luyện tập..."
          disabled={disabled}
          className="flex-1 max-h-[120px] min-h-[24px] bg-transparent border-none resize-none focus:outline-none focus:ring-0 px-2 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-500"
          rows={1}
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          iconOnly
          className={`h-8 w-8 rounded-lg flex-shrink-0 ${text.trim() && !disabled ? "bg-brand-blue-600 hover:bg-brand-blue-700 text-white" : "bg-neutral-200 text-neutral-400"}`}
        >
          <SendHorizontal size={16} />
        </Button>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-neutral-400">Enter để gửi, Shift + Enter để xuống dòng</span>
      </div>
    </div>
  );
}
