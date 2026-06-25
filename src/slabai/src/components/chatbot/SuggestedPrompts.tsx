import React from "react";
import { MessageSquarePlus } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const prompts = [
    "Hôm nay tôi nên tập gì?",
    "Phân tích buổi chạy gần nhất",
    "Tôi có đang tập quá sức không?",
    "Điều chỉnh giáo án tuần này",
    "Giải thích các vùng nhịp tim",
    "Tạo buổi tập bơi cho người mới"
  ];

  return (
    <div className="flex flex-col gap-3 my-4">
      <div className="flex items-center gap-2 text-neutral-500 text-sm">
        <MessageSquarePlus size={16} />
        <span className="font-medium">Gợi ý cho bạn:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSelect(prompt)}
            className="text-left text-sm px-3 py-2 bg-neutral-50 hover:bg-brand-blue-50 border border-neutral-200 hover:border-brand-blue-200 text-neutral-700 hover:text-brand-blue-700 rounded-lg transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
