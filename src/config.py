import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# OpenAI Config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Arize Phoenix Config
PHOENIX_PROJECT_NAME = os.getenv("PHOENIX_PROJECT_NAME", "phoenix-demo-agent")
PHOENIX_COLLECTOR_ENDPOINT = os.getenv("PHOENIX_COLLECTOR_ENDPOINT", "http://localhost:6006/v1/traces")
PHOENIX_API_KEY = os.getenv("PHOENIX_API_KEY", "")

# Print config status for feedback (excluding sensitive keys)
print("--- Configuration Loaded ---")
print(f"Project Name: {PHOENIX_PROJECT_NAME}")
print(f"Phoenix Collector: {PHOENIX_COLLECTOR_ENDPOINT}")
if PHOENIX_API_KEY:
    print("Phoenix Cloud API Key: [SET]")
else:
    print("Phoenix Cloud API Key: [NOT SET] (Running locally)")
if OPENAI_API_KEY:
    print("OpenAI API Key: [SET]")
else:
    print("OpenAI API Key: [NOT SET]")
print("----------------------------")
