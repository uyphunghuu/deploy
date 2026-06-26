"""LLM client wrappers for Azure OpenAI and OpenRouter (streaming)."""

import sys
import json
import codecs
import httpx

from src.config import (
    AZURE_ENDPOINT, AZURE_API_KEY, AZURE_MODEL, AZURE_API_VERSION,
    OPENROUTER_API_KEY, OPENROUTER_URL,
)


def sanitize_text(text: str) -> str:
    """Remove surrogate characters that cause UTF-8 encoding errors."""
    try:
        text.encode("utf-8")
        return text
    except UnicodeEncodeError:
        return text.encode("utf-8", errors="replace").decode("utf-8")


def safe_json_bytes(obj) -> bytes:
    """Serialize to JSON bytes, replacing any surrogate characters."""
    try:
        return json.dumps(obj, ensure_ascii=False).encode("utf-8")
    except UnicodeEncodeError:
        return json.dumps(obj, ensure_ascii=True).encode("utf-8")


def _parse_sse_stream(response) -> str:
    """Parse SSE stream from an httpx response, print tokens, return full content."""
    full_content = ""
    buffer = ""
    decoder = codecs.getincrementaldecoder("utf-8")("replace")

    for raw_chunk in response.iter_bytes():
        chunk = decoder.decode(raw_chunk, False)
        buffer += chunk
        while "\n" in buffer:
            line, buffer = buffer.split("\n", 1)
            line = line.strip()
            if not line or not line.startswith("data: "):
                continue
            data_str = line[6:]
            if data_str == "[DONE]":
                return full_content
            try:
                data = json.loads(data_str)
                choices = data.get("choices", [])
                if choices:
                    token = choices[0].get("delta", {}).get("content", "")
                    if token:
                        token = sanitize_text(token)
                        sys.stdout.write(token)
                        sys.stdout.flush()
                        full_content += token
            except json.JSONDecodeError:
                continue
    return full_content


def azure_stream(messages: list[dict], max_tokens: int = 500, temperature: float = 0.7) -> str:
    """Stream a chat completion from Azure OpenAI."""
    url = f"{AZURE_ENDPOINT}/openai/deployments/{AZURE_MODEL}/chat/completions?api-version={AZURE_API_VERSION}"
    headers = {"Content-Type": "application/json", "api-key": AZURE_API_KEY}
    payload = {
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }

    try:
        with httpx.stream("POST", url, headers=headers, content=safe_json_bytes(payload), timeout=60) as response:
            response.raise_for_status()
            return _parse_sse_stream(response)
    except httpx.HTTPStatusError as e:
        error_msg = f"[Model API returned {e.response.status_code}]"
        sys.stdout.write(error_msg)
        sys.stdout.flush()
        return error_msg


def openrouter_stream(messages: list[dict], model: str, max_tokens: int = 2048, temperature: float = 0.7) -> str:
    """Stream a chat completion from OpenRouter."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://msb-chatbot.local",
        "X-OpenRouter-Title": "MSB Sales Chatbot",
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }

    try:
        with httpx.stream("POST", OPENROUTER_URL, headers=headers, content=safe_json_bytes(payload), timeout=60) as response:
            response.raise_for_status()
            return _parse_sse_stream(response)
    except httpx.HTTPStatusError as e:
        error_msg = f"[Model API returned {e.response.status_code}]"
        sys.stdout.write(error_msg)
        sys.stdout.flush()
        return error_msg
