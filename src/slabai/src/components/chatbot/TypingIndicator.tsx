import React from "react";

export function TypingIndicator() {
  return (
    <div className="flex w-full justify-start mb-4">
      <div className="flex max-w-[85%] flex-row items-end gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-brand-orange-100 text-brand-orange-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </div>
        <div className="px-4 py-3 bg-neutral-100 rounded-2xl rounded-bl-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    </div>
  );
}
