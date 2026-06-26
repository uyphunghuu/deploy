import { NextRequest } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3.5-9b";

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || `Bạn là trợ lý tài chính MSB (Ngân hàng TMCP Hàng Hải Việt Nam). Trả lời ngắn gọn, chính xác, bằng tiếng Việt. Chỉ trả lời dựa trên kiến thức về sản phẩm MSB.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();
    const selectedModel = model || DEFAULT_MODEL;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://msb-chatbot.local",
        "X-OpenRouter-Title": "MSB Chatbot UI",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response(`Model API returned ${response.status}`, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || "";
              if (token) {
                controller.enqueue(encoder.encode(token));
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(`Internal server error: ${errMsg}`, { status: 500 });
  }
}
