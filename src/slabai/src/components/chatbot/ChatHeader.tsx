import React from "react";
import { X, Plus, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

interface ChatHeaderProps {
  onClose: () => void;
  onNewChat: () => void;
}

export function ChatHeader({ onClose, onNewChat }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-brand-blue-50 text-brand-blue-600 rounded-xl">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-neutral-900 leading-tight">SLABAI AI Coach</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success-500"></span>
            <span className="text-xs text-neutral-500">Trợ lý luyện tập</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          iconOnly
          onClick={onNewChat}
          className="text-neutral-500 hover:text-brand-blue-600 w-8 h-8 rounded-lg"
          aria-label="Tạo cuộc trò chuyện mới"
        >
          <Plus size={18} />
        </Button>
        <Button
          variant="ghost"
          iconOnly
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-900 w-8 h-8 rounded-lg"
          aria-label="Đóng AI Coach"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}
