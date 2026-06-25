import json
import time
from openai import OpenAI
from src import config
from src.mlflow_tracker import AgentTracker, calculate_cost

# Mock database/tool
def get_stock_status(product_id: str) -> str:
    """Gets the stock status, name, and price for a given product ID."""
    print(f"\n[Tool Execution] get_stock_status called with product_id='{product_id}'")
    # Simulate API latency
    time.sleep(0.4)
    
    database = {
        "PROD-101": {"name": "Premium AI Laptop", "stock": 5, "price": "$1200", "description": "High performance laptop optimized for local AI workflows."},
        "PROD-102": {"name": "Wireless Noise-Cancelling Headphones", "stock": 0, "price": "$250", "description": "Active noise cancelling with 30-hour battery life."},
        "PROD-103": {"name": "Smart Watch Series 5", "stock": 15, "price": "$350", "description": "Fitness tracking and cellular connectivity."}
    }
    
    result = database.get(product_id, {"error": f"Product '{product_id}' not found"})
    print(f"[Tool Execution] Returning: {result}")
    return json.dumps(result)

def run_agent_workflow(
    user_query: str,
    model: str = "gpt-4o",
    prompt_version: str = "v1",
    temperature: float = 0.0,
    tracker: AgentTracker | None = None,
) -> dict:
    """
    Runs an LLM agent workflow with tool calling using the OpenAI SDK.

    Tích hợp MLflow tracking qua AgentTracker (tuỳ chọn).
    Nếu tracker=None thì không track gì — hoàn toàn backward-compatible.

    Args:
        user_query:      câu hỏi của user
        model:           tên model OpenAI (default "gpt-4o")
        prompt_version:  version prompt để track experiments (default "v1")
        temperature:     temperature cho LLM (default 0.0)
        tracker:         AgentTracker instance, hoặc None để bỏ qua tracking

    Returns:
        dict với keys: query, response, token_usage, latency_ms, cost_usd
    """
    if not config.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set. Please define it in your environment or .env file.")

    client = OpenAI(api_key=config.OPENAI_API_KEY)
    start_time = time.time()

    # ── Log params vào MLflow ──────────────────────────────────────────────────
    if tracker:
        tracker.log_params({
            "model":          model,
            "prompt_version": prompt_version,
            "temperature":    temperature,
            "tool_choice":    "auto",
        })

    # 1. Define system context and conversation history
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert product specialist agent. You have access to tools to look up "
                "live stock details using product IDs. Answer the user query using details from tool outputs. "
                "If a product is out of stock, offer sympathy and recommend checking back next week."
            )
        },
        {"role": "user", "content": user_query}
    ]

    # 2. Define tools available to the model
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_stock_status",
                "description": "Checks details, pricing, and current stock inventory level for a specific product ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "The unique product code (e.g., PROD-101, PROD-102, PROD-103)."
                        }
                    },
                    "required": ["product_id"]
                }
            }
        }
    ]

    print(f"\n[Agent] Initiating conversation for query: '{user_query}'")

    # 3. Model turn 1
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=temperature,
    )

    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls
    used_tool = False

    # 4. Check if tool call requested
    if tool_calls:
        used_tool = True
        print(f"[Agent] LLM requested tool execution: {[tc.function.name for tc in tool_calls]}")
        messages.append(response_message)

        # Execute tools and append result
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)

            if function_name == "get_stock_status":
                tool_output = get_stock_status(function_args.get("product_id"))
            else:
                tool_output = json.dumps({"error": "Unknown tool invoked"})

            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": tool_output
            })

        print("[Agent] Submitting tool outcomes back to LLM...")

        # Model turn 2
        second_response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
        )

        final_answer = second_response.choices[0].message.content
        prompt_tokens     = response.usage.prompt_tokens     + second_response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens + second_response.usage.completion_tokens
        total_tokens      = response.usage.total_tokens      + second_response.usage.total_tokens

    else:
        print("[Agent] LLM formulated direct answer without tools.")
        final_answer      = response_message.content
        prompt_tokens     = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        total_tokens      = response.usage.total_tokens

    latency_ms = round((time.time() - start_time) * 1000, 2)
    cost_usd   = calculate_cost(model, prompt_tokens, completion_tokens)

    print(f"[Agent] Completed. Final Answer:\n\"{final_answer}\"\n")

    # ── Log metrics vào MLflow ─────────────────────────────────────────────────
    if tracker:
        tracker.log_metrics({
            "prompt_tokens":     float(prompt_tokens),
            "completion_tokens": float(completion_tokens),
            "total_tokens":      float(total_tokens),
            "latency_ms":        latency_ms,
            "cost_usd":          cost_usd,
            "used_tool":         float(used_tool),
        })
        # Lưu artifacts
        tracker.log_text(user_query,   "query.txt")
        tracker.log_text(final_answer, "response.txt")
        tracker.log_dict(
            {
                "model": model,
                "prompt_version": prompt_version,
                "query": user_query,
                "response": final_answer,
                "token_usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                },
                "latency_ms": latency_ms,
                "cost_usd": cost_usd,
            },
            "run_summary.json",
        )

    return {
        "query":       user_query,
        "response":    final_answer,
        "token_usage": {
            "prompt_tokens":     prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens":      total_tokens,
        },
        "latency_ms": latency_ms,
        "cost_usd":   cost_usd,
    }
