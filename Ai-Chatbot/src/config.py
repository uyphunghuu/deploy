"""Centralized configuration and path management."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Project root = parent of src/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

# ── Paths ──
SKILLS_DIR = PROJECT_ROOT / "skills"
DOCUMENTS_DIR = PROJECT_ROOT / "documents"

SKILL_PATH = SKILLS_DIR / "acknowledge_validation_sale" / "SKILL.md"
KNOWLEDGE_PATH = DOCUMENTS_DIR / "msb-sale-knowledge.md"

# ── Azure OpenAI ──
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_LLM_URL", "")
AZURE_API_KEY = os.getenv("AZURE_OPENAI_LLM_API_KEY", "")
AZURE_MODEL = os.getenv("AZURE_OPENAI_LLM_MODEL", "gpt-4o")
AZURE_API_VERSION = "2024-08-01-preview"

# ── OpenRouter ──
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL_1 = os.getenv("OPENROUTER_MODEL_1", "qwen/qwen3.5-9b")
OPENROUTER_MODEL_2 = os.getenv("OPENROUTER_MODEL_2", "google/gemma-4-31b-it")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# -- Crawl Page URLs --
urls = '''
https://www.msb.com.vn/khach-hang-ca-nhan/
'''
