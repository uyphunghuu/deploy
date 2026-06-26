#!/usr/bin/env python3
"""
MSB Sales Chatbot CLI (Streaming, Multi-Model)
Supports Azure OpenAI GPT-4o, OpenRouter Qwen 3.5, and OpenRouter Gemma 4.

Run from project root: python -m src.chatbot
"""

import sys
import os
import httpx

# Force UTF-8 for terminal I/O (fixes Vietnamese input on macOS)
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
sys.stdin.reconfigure(encoding="utf-8", errors="surrogateescape")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from src.config import OPENROUTER_MODEL_1, OPENROUTER_MODEL_2
from src.prompt_builder import build_prompt
from src.llm_clients import azure_stream, openrouter_stream, sanitize_text


def build_system_prompt() -> str:
    """Build system prompt from skill + compiled product knowledge."""
    return build_prompt()


def select_model() -> str:
    """Display model selection menu."""
    print("\nSelect model:")
    print("  [1] OpenRouter OpenAI GPT-4o")
    print("  [2] OpenRouter Qwen 3.5 (9B)")
    print("  [3] OpenRouter Gemma 4")
    print("  [4] A/B/C Testing (GPT-4o vs Qwen 3.5 vs Gemma 4)")
    while True:
        choice = input("\nSelect (1/2/3/4): ").strip()
        if choice in ("1", "2", "3", "4"):
            return choice
        print("Select 1, 2, 3, or 4.")


def stream_reply(messages: list[dict], model_choice: str) -> str:
    """Route to appropriate LLM and stream response."""
    if model_choice == "1":
        sys.stdout.write("\n🤖 [GPT-4o]: ")
        sys.stdout.flush()
        reply = azure_stream(messages)
        print()
        return reply
    elif model_choice == "2":
        sys.stdout.write("\n🤖 [Qwen 3.5]: ")
        sys.stdout.flush()
        reply = openrouter_stream(messages, OPENROUTER_MODEL_1)
        print()
        return reply
    elif model_choice == "3":
        sys.stdout.write("\n🤖 [Gemma 4]: ")
        sys.stdout.flush()
        reply = openrouter_stream(messages, OPENROUTER_MODEL_2)
        print()
        return reply
    else:
        # A/B/C: All three models
        sys.stdout.write("\n🤖 [GPT-4o]: ")
        sys.stdout.flush()
        reply_gpt = azure_stream(messages)
        print()

        sys.stdout.write("\n🤖 [Qwen 3.5]: ")
        sys.stdout.flush()
        openrouter_stream(messages, OPENROUTER_MODEL_1)
        print()

        sys.stdout.write("\n🤖 [Gemma 4]: ")
        sys.stdout.flush()
        openrouter_stream(messages, OPENROUTER_MODEL_2)
        print()

        return reply_gpt


def main():
    print("=" * 60)
    print("  MSB Sales Chatbot - Acknowledge & Validate")
    print("  Streaming SSE | Multi-Model Support")
    print("  Type 'quit' or 'exit' to end")
    print("=" * 60)

    model_choice = select_model()
    model_name = {
        "1": "Azure OpenAI GPT-4o",
        "2": "OpenRouter Qwen 3.5 (9B)",
        "3": "OpenRouter Gemma 4",
        "4": "GPT-4o vs Qwen 3.5 vs Gemma 4 (A/B/C)",
    }[model_choice]
    print(f"\n  → Model: {model_name}")
    print("-" * 60)

    system_prompt = build_system_prompt()
    messages = [{"role": "system", "content": system_prompt}]

    # Generate dynamic welcome message
    welcome_messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": (
                "Hãy chào đón khách hàng bằng một câu ngắn gọn, thân thiện, "
                "giới thiệu bạn là trợ lý tài chính MSB và hỏi khách hàng hôm nay "
                "cần hỗ trợ về các sản phẩm của MSB. Mỗi lần chào khác nhau "
                "một chút cho tự nhiên."
            ),
        },
    ]

    welcome = stream_reply(welcome_messages, model_choice)
    messages.append({"role": "assistant", "content": sanitize_text(welcome)})

    # Chat loop
    while True:
        try:
            user_input = input("\n🧑 Khách hàng: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nKết thúc hội thoại. Tạm biệt!")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "q"):
            print("\nKết thúc hội thoại. Tạm biệt!")
            break

        messages.append({"role": "user", "content": user_input})

        try:
            reply = stream_reply(messages, model_choice)
            messages.append({"role": "assistant", "content": sanitize_text(reply)})
        except httpx.HTTPStatusError as e:
            print(f"\n❌ API Error: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
