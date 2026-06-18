import time
from src.instrumentation import init_instrumentation
from src.agent import run_agent_workflow
from src.evaluation import run_phoenix_evaluation

def main():
    print("====================================================")
    print("Starting Arize Phoenix Tracing & Evaluation Pipeline")
    print("====================================================")

    # 1. Initialize OpenTelemetry tracing and start local Phoenix server if needed
    init_instrumentation()

    # 2. Run a sample Agent interaction
    # Query for PROD-102 (Wireless Headphones, which is out of stock in database)
    # This will trigger the tool call get_stock_status('PROD-102') and test response grounding
    user_query = "Hi, can you check if the product PROD-102 is in stock and tell me its price?"
    
    print("\n--- Running Agent Workflow ---")
    try:
        agent_result = run_agent_workflow(user_query)
    except Exception as e:
        print(f"\n[Error] Failed to run agent: {e}")
        print("Please ensure your OPENAI_API_KEY is configured correctly in .env.")
        return

    # 3. Define the ground-truth/context reference for evaluation
    # This matches the real data returned by the tool
    grounding_context = (
        "Product: PROD-102 (Wireless Noise-Cancelling Headphones). "
        "Stock: 0 (Out of stock). "
        "Price: $250. "
        "Description: Active noise cancelling with 30-hour battery life."
    )

    # Prepare data for Phoenix Evals
    # Phoenix expects input (query), output (response), and reference (grounding context)
    eval_dataset = [
        {
            "input": user_query,
            "output": agent_result["response"],
            "reference": grounding_context
        }
    ]

    # 4. Trigger the LLM-as-a-judge Evaluations
    print("\n--- Launching Evaluation Pipeline ---")
    try:
        run_phoenix_evaluation(eval_dataset)
    except Exception as e:
        print(f"\n[Error] Evaluation run failed: {e}")
        print("Please check your OpenAI API usage limits or configuration.")

    print("\n====================================================")
    print("Tracing & Evaluation run completed.")
    print("If running locally, you can view all traces and evals at: http://localhost:6006")
    print("Press Ctrl+C to stop the local Phoenix server if you are done.")
    print("====================================================")

    # Keep the server running so the user can inspect the UI
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nExiting. Thank you for using Arize Phoenix!")

if __name__ == "__main__":
    main()
