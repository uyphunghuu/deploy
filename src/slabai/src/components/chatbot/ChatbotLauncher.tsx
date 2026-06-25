import React, { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { ChatbotPanel } from "./ChatbotPanel";

export function ChatbotLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-brand-blue-100"
          aria-label="Mở SLABAI AI Coach"
        >
          <MessageSquareText size={28} />
        </button>
      )}
      
      <ChatbotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
