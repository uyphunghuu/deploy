#!/usr/bin/env python3
"""
Prompt Builder.
Loads SKILL.md, injects compiled product data into {{PRODUCT_CATALOG}} placeholder,
returns the final system prompt for the chatbot LLM.

Usage:
    from src.prompt_builder import build_prompt
    system_prompt = build_prompt()
"""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

SKILL_PATH = PROJECT_ROOT / "skills" / "acknowledge_validation_sale" / "SKILL.md"
COMPILED_PATH = PROJECT_ROOT / "documents" / "msb-products-compiled.md"


def load_file(path: Path) -> str:
    """Load a text file with UTF-8 fallback."""
    if not path.exists():
        print(f"⚠️  File not found: {path}")
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def build_prompt(skill_path: Path = SKILL_PATH, compiled_path: Path = COMPILED_PATH) -> str:
    """
    Build the final system prompt:
    1. Load SKILL.md (contains {{PRODUCT_CATALOG}} placeholder)
    2. Load msb-products-compiled.md
    3. Replace placeholder with compiled data
    4. Return complete prompt ready for LLM
    """
    skill = load_file(skill_path)
    knowledge = load_file(compiled_path)

    if "{{PRODUCT_CATALOG}}" in skill:
        return skill.replace("{{PRODUCT_CATALOG}}", knowledge)
    else:
        # Fallback: append knowledge at the end
        print("⚠️  No {{PRODUCT_CATALOG}} placeholder found in SKILL.md. Appending knowledge at end.")
        return f"{skill}\n\n---\n\n[DỮ LIỆU SẢN PHẨM]\n{knowledge}\n"


if __name__ == "__main__":
    prompt = build_prompt()
    print(f"✅ Prompt built successfully")
    print(f"   Skill:     {SKILL_PATH.name} ({SKILL_PATH.stat().st_size // 1024}KB)")
    if COMPILED_PATH.exists():
        print(f"   Knowledge: {COMPILED_PATH.name} ({COMPILED_PATH.stat().st_size // 1024}KB)")
    print(f"   Total:     {len(prompt) // 1000}k chars (~{len(prompt) // 4} tokens est.)")
    print(f"\n--- First 500 chars ---")
    print(prompt[:500])
