"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
  PaperPlaneRight,
  Robot,
  User,
  CircleNotch,
  CaretDown,
  PencilSimple,
  Sparkle,
  BookOpen,
} from "@phosphor-icons/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Model {
  id: string;
  label: string;
  short: string;
}

const MODELS: Model[] = [
  { id: "qwen/qwen3.5-9b", label: "OpenRouter - Qwen 3.5 (9B)", short: "Qwen 3.5" },
  { id: "google/gemma-4-31b-it", label: "OpenRouter - Gemma 4 (31B)", short: "Gemma 4" },
  { id: "openai/gpt-4o", label: "OpenRouter - GPT-4o", short: "GPT-4o" },
];

const SUGGESTIONS = [
  { icon: PencilSimple, label: "Tư vấn thẻ tín dụng" },
  { icon: Sparkle, label: "Tìm hiểu về gửi tiết kiệm" },
  { icon: BookOpen, label: "Tôi muốn vay tiêu dùng" },
];

const WELCOME_PROMPT = "Hãy chào đón khách hàng bằng một câu ngắn gọn, thân thiện, giới thiệu bạn là chuyên viên cao cấp tư vấn sản phẩm của MSB và sẵn sàng tư vấn các sản phẩm của MSB.";

function formatMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  // Close model picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Generate welcome message when model is selected
  async function generateWelcome(model: Model) {
    setIsLoading(true);
    const assistantId = crypto.randomUUID();
    setMessages([{ id: assistantId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model.id,
          messages: [{ role: "user", content: WELCOME_PROMPT }],
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          content += chunk;
          setMessages([{ id: assistantId, role: "assistant", content }]);
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Connection error";
      setMessages([{ id: assistantId, role: "assistant", content: `Error: ${errMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleModelSelect(model: Model) {
    setSelectedModel(model);
    setShowModelPicker(false);
    setMessages([]);
    generateWelcome(model);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || !selectedModel) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel.id,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: assistantContent } : m
            )
          );
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `Error: ${errMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  const hasStarted = selectedModel !== null;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center">
      {/* Pre-start: model selection screen */}
      {!hasStarted && (
        <div className="flex flex-col items-center mt-16">
          {/* Orb */}
          <div className="orb-animate mb-6">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-300 via-purple-200 to-emerald-200 opacity-60 blur-md" />
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-indigo-200 via-white to-emerald-100 shadow-lg" />
              <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-white/80 via-purple-100/50 to-transparent" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            MSB Financial Assistant
          </h1>
          <p className="text-sm text-slate-500 mb-8">Select a model to start</p>

          {/* Model selection cards */}
          <div className="flex flex-wrap gap-3 justify-center">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <Robot size={24} weight="duotone" className="text-indigo-500" />
                <span className="text-sm font-medium text-slate-700">{model.short}</span>
                <span className="text-[11px] text-slate-400">OpenRouter</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat started */}
      {hasStarted && (
        <>
          {/* Messages area */}
          {hasMessages && (
            <div
              ref={scrollRef}
              className="w-full flex-1 overflow-y-auto px-2 py-4 space-y-4 max-h-[60dvh] mb-4"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 mt-0.5">
                      <Robot size={14} weight="fill" className="text-indigo-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-500 text-white rounded-br-md"
                        : "bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm"
                    }`}
                  >
                    <div className="message-content whitespace-pre-wrap">
                      {msg.content ? formatMarkdown(msg.content) : (
                        <CircleNotch size={16} className="animate-spin text-slate-400" />
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 mt-0.5">
                      <User size={14} weight="fill" className="text-indigo-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="w-full">
            <form onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm focus-within:border-indigo-400 focus-within:shadow-md transition-all">
                {/* Textarea */}
                <div className="px-4 pt-3 pb-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    disabled={isLoading}
                  />
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                  {/* Left: model picker */}
                  <div className="relative" ref={pickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowModelPicker(!showModelPicker)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Robot size={14} weight="duotone" className="text-indigo-500" />
                      {selectedModel.short}
                      <CaretDown size={12} className="text-slate-400" />
                    </button>

                    {/* Dropdown */}
                    {showModelPicker && (
                      <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                          Switch Model
                        </div>
                        {MODELS.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => handleModelSelect(model)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                              selectedModel.id === model.id
                                ? "text-indigo-600 bg-indigo-50/50 font-medium"
                                : "text-slate-700"
                            }`}
                          >
                            {model.label}
                            {selectedModel.id === model.id && (
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: send */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white transition-all hover:bg-indigo-600 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-indigo-500"
                  >
                    {isLoading ? (
                      <CircleNotch size={15} className="animate-spin" />
                    ) : (
                      <PaperPlaneRight size={15} weight="fill" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-3 justify-center mt-5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSuggestion(s.label)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <s.icon size={18} weight="duotone" className="text-slate-400" />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
