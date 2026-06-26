#!/usr/bin/env python3
"""
Product Compiling Pipeline.
Reads raw crawled markdown from documents/raw/, filters product pages,
sends to LLM with product_compiling skill, outputs a single compiled knowledge file.

Supports incremental updates: if compiled file exists, detects changes
in raw files and only updates the affected sections.

Usage:
    python -m src.compile_pipeline                  # Full compile or incremental update
    python -m src.compile_pipeline --full           # Force full recompile
    python -m src.compile_pipeline --filter "the"   # Only card products
"""

import asyncio
import argparse
import os
import json
import hashlib
import httpx
from pathlib import Path
from dotenv import load_dotenv

# ── Config ──
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

RAW_DIR = PROJECT_ROOT / "documents" / "raw"
SKILL_PATH = PROJECT_ROOT / "skills" / "product_compiling" / "SKILL.md"
DEFAULT_OUTPUT = PROJECT_ROOT / "documents" / "msb-products-compiled.md"

AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_LLM_URL", "")
AZURE_API_KEY = os.getenv("AZURE_OPENAI_LLM_API_KEY", "")
AZURE_MODEL = os.getenv("AZURE_OPENAI_LLM_MODEL", "gpt-4o")
AZURE_API_VERSION = "2024-08-01-preview"

# Product-relevant path patterns (Vietnamese site structure)
PRODUCT_PATTERNS = [
    "khach-hang-ca-nhan-the",
    "khach-hang-ca-nhan-vay",
    "khach-hang-ca-nhan-tiet-kiem",
    "khach-hang-ca-nhan-tai-khoan",
    "khach-hang-ca-nhan-bao-hiem",
    "khach-hang-ca-nhan-dau-tu",
    "khach-hang-ca-nhan-ngan-hang-so",
    "khach-hang-ca-nhan-chuyen-va-nhan-tien",
    "khach-hang-doanh-nghiep-tai-tro",
    "khach-hang-doanh-nghiep-thanh-toan",
    "khach-hang-doanh-nghiep-nganh-nghe",
    "khach-hang-doanh-nghiep-ngoai-hoi",
    "dinh-che-tai-chinh",
]

# Skip patterns (noise)
SKIP_PATTERNS = [
    "jobs-msb",
    "author-",
    "category-",
    "search-",
    "sitemap",
    "user-settings",
    "login",
    "register",
    "ebank-",
    "digibank-",
    "35nam-",
    "d-innovation",
    "help-msb",
    "mkt-msb",
    "uudai-msb",
    "careers",
    "tuyen-dung",
    "nha-dau-tu",
    "tin-tuc-va-su-kien",
    "about-us",
    "en-",
    "so-do-website",
    "documents-2012",
]


def load_skill() -> str:
    return SKILL_PATH.read_text(encoding="utf-8")


def get_product_files(filter_pattern: str | None = None) -> list[Path]:
    """Get filtered list of product-relevant raw markdown files."""
    all_files = sorted(RAW_DIR.glob("*.md"))
    result = []

    for f in all_files:
        name = f.name.lower()

        # Skip noise
        if any(skip in name for skip in SKIP_PATTERNS):
            continue

        # If custom filter specified, use that
        if filter_pattern:
            if filter_pattern.lower() in name:
                result.append(f)
            continue

        # Otherwise, match product patterns
        if any(pat in name for pat in PRODUCT_PATTERNS):
            result.append(f)

    return result


def chunk_files(files: list[Path], max_chars: int = 80000) -> list[str]:
    """
    Group files into chunks that fit within token limits.
    ~80k chars ≈ ~20k tokens, leaving room for system prompt + output.
    """
    chunks = []
    current_chunk = ""

    for f in files:
        content = f.read_text(encoding="utf-8", errors="replace")
        # Skip very short files
        if len(content.strip()) < 100:
            continue

        entry = f"\n\n{'='*60}\n📄 FILE: {f.name}\n{'='*60}\n\n{content.strip()}\n"

        if len(current_chunk) + len(entry) > max_chars:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = entry
        else:
            current_chunk += entry

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def call_llm(system_prompt: str, user_content: str) -> str:
    """Call Azure OpenAI (non-streaming) for compilation."""
    url = f"{AZURE_ENDPOINT}/openai/deployments/{AZURE_MODEL}/chat/completions?api-version={AZURE_API_VERSION}"
    headers = {"Content-Type": "application/json", "api-key": AZURE_API_KEY}

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": 16000,
        "temperature": 0.2,
    }

    resp = httpx.post(url, headers=headers, json=payload, timeout=120)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def compile_chunks(skill: str, chunks: list[str]) -> list[str]:
    """Send each chunk to LLM for extraction, return compiled sections."""
    sections = []

    for i, chunk in enumerate(chunks):
        print(f"   🔄 Compiling chunk {i+1}/{len(chunks)} ({len(chunk)//1000}k chars)...", flush=True)

        user_msg = f"""Phân tích các trang web sản phẩm ngân hàng MSB bên dưới và trích xuất thông tin sản phẩm theo định dạng cây phân cấp (hierarchy markdown).

Chỉ trích xuất thông tin SẢN PHẨM (tên, đặc điểm, phí, điều kiện, ưu đãi). Bỏ qua navigation, footer, quảng cáo, tin tức.

Ngôn ngữ output: Tiếng Việt.

--- RAW DATA ---
{chunk}
--- END ---"""

        result = call_llm(skill, user_msg)
        sections.append(result)
        print(f"   ✅ Chunk {i+1} done ({len(result)//1000}k chars output)")

    return sections


def merge_sections(skill: str, sections: list[str]) -> str:
    """If multiple sections, merge them into a single cohesive document."""
    if len(sections) == 1:
        return sections[0]

    print(f"   🔄 Merging {len(sections)} sections into final document...", flush=True)

    combined = "\n\n---\n\n".join(sections)

    user_msg = f"""Bên dưới là nhiều phần trích xuất sản phẩm MSB (đã phân tích từ các trang web khác nhau). 
Hãy hợp nhất thành MỘT tài liệu duy nhất, loại bỏ trùng lặp, sắp xếp theo danh mục sản phẩm rõ ràng.

Giữ nguyên format cây phân cấp (indented markdown lists), bold cho thuộc tính.
Ngôn ngữ: Tiếng Việt.

--- SECTIONS TO MERGE ---
{combined}
--- END ---"""

    result = call_llm(skill, user_msg)
    print(f"   ✅ Merge done ({len(result)//1000}k chars)")
    return result


# ══════════════════════════════════════════════════════════════
# Manifest & Incremental Update
# ══════════════════════════════════════════════════════════════

MANIFEST_PATH = PROJECT_ROOT / "documents" / ".compile_manifest.json"


def file_hash(path: Path) -> str:
    """Compute MD5 hash of a file."""
    return hashlib.md5(path.read_bytes()).hexdigest()


def load_manifest() -> dict:
    """Load the previous compile manifest."""
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {}


def save_manifest(files: list[Path]):
    """Save current file hashes to manifest."""
    manifest = {str(f.name): file_hash(f) for f in files}
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")


def detect_changes(files: list[Path]) -> dict:
    """
    Compare current files against manifest.
    Returns: {"added": [...], "modified": [...], "removed": [...]}
    """
    old_manifest = load_manifest()
    current = {f.name: file_hash(f) for f in files}

    added = [f for f in files if f.name not in old_manifest]
    modified = [f for f in files if f.name in old_manifest and current[f.name] != old_manifest[f.name]]
    removed = [name for name in old_manifest if name not in current]

    return {"added": added, "modified": modified, "removed": removed}


def incremental_update(skill: str, compiled_path: Path, changes: dict) -> str:
    """
    Read existing compiled doc, send changes to LLM to produce updated version.
    """
    existing_compiled = compiled_path.read_text(encoding="utf-8")

    # Build the "changes" content
    change_parts = []

    if changes["added"]:
        change_parts.append("## TRANG MỚI THÊM (cần bổ sung vào tài liệu):\n")
        for f in changes["added"]:
            content = f.read_text(encoding="utf-8", errors="replace")
            if len(content.strip()) > 100:
                change_parts.append(f"\n### FILE: {f.name}\n{content.strip()[:15000]}\n")

    if changes["modified"]:
        change_parts.append("\n## TRANG ĐÃ CẬP NHẬT (cần cập nhật thông tin mới):\n")
        for f in changes["modified"]:
            content = f.read_text(encoding="utf-8", errors="replace")
            if len(content.strip()) > 100:
                change_parts.append(f"\n### FILE: {f.name}\n{content.strip()[:15000]}\n")

    if changes["removed"]:
        change_parts.append("\n## TRANG ĐÃ XÓA (cần loại bỏ sản phẩm liên quan):\n")
        for name in changes["removed"]:
            change_parts.append(f"- {name}\n")

    changes_text = "\n".join(change_parts)

    user_msg = f"""Bạn có tài liệu sản phẩm MSB đã biên soạn (EXISTING DOCUMENT) và danh sách các thay đổi từ website (CHANGES).

Nhiệm vụ:
1. Đọc tài liệu hiện tại
2. Áp dụng các thay đổi:
   - Trang mới → Trích xuất thông tin sản phẩm, bổ sung vào đúng danh mục
   - Trang cập nhật → Cập nhật thông tin đã thay đổi (phí, ưu đãi, điều kiện, etc.)
   - Trang xóa → Loại bỏ sản phẩm không còn tồn tại
3. Trả về TOÀN BỘ tài liệu đã cập nhật (không chỉ phần thay đổi)

Giữ nguyên format cây phân cấp, bold cho thuộc tính.
Ngôn ngữ: Tiếng Việt.

--- EXISTING DOCUMENT ---
{existing_compiled}
--- END EXISTING ---

--- CHANGES ---
{changes_text}
--- END CHANGES ---"""

    print(f"   🔄 Sending incremental update to LLM ({len(user_msg)//1000}k chars)...", flush=True)
    result = call_llm(skill, user_msg)
    print(f"   ✅ Update done ({len(result)//1000}k chars)")
    return result


# ══════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════

def full_compile(skill: str, files: list[Path], output_path: Path):
    """Run full compilation from scratch."""
    chunks = chunk_files(files)
    print(f"\n📦 Split into {len(chunks)} chunks for LLM processing")

    print(f"\n🤖 Compiling with {AZURE_MODEL}...")
    sections = compile_chunks(skill, chunks)

    if len(sections) > 1:
        print(f"\n🔗 Merging {len(sections)} sections...")
        final = merge_sections(skill, sections)
    else:
        final = sections[0]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"# MSB - Danh mục Sản phẩm (Compiled)\n\n")
        f.write(f"> Auto-compiled from {len(files)} raw pages\n")
        f.write(f"> Skill: {SKILL_PATH.name}\n")
        f.write(f"> Model: {AZURE_MODEL}\n\n")
        f.write("---\n\n")
        f.write(final)
        f.write("\n")

    save_manifest(files)

    print(f"\n{'='*60}")
    print(f"✅ Full compile done! Output: {output_path}")
    print(f"   📄 Size: {output_path.stat().st_size / 1024:.1f} KB")


def incremental_compile(skill: str, files: list[Path], output_path: Path, changes: dict):
    """Run incremental update on existing compiled doc."""
    n_changes = len(changes["added"]) + len(changes["modified"]) + len(changes["removed"])
    print(f"\n📊 Changes detected:")
    print(f"   ➕ Added:    {len(changes['added'])} files")
    print(f"   ✏️  Modified: {len(changes['modified'])} files")
    print(f"   🗑️  Removed:  {len(changes['removed'])} files")

    # If too many changes (>30 files), do full recompile
    if n_changes > 30:
        print(f"\n⚠️  Too many changes ({n_changes}). Running full recompile instead.")
        full_compile(skill, files, output_path)
        return

    print(f"\n🤖 Incremental update with {AZURE_MODEL}...")
    updated = incremental_update(skill, output_path, changes)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"# MSB - Danh mục Sản phẩm (Compiled)\n\n")
        f.write(f"> Auto-compiled from {len(files)} raw pages (incremental update)\n")
        f.write(f"> Skill: {SKILL_PATH.name}\n")
        f.write(f"> Model: {AZURE_MODEL}\n\n")
        f.write("---\n\n")
        f.write(updated)
        f.write("\n")

    save_manifest(files)

    print(f"\n{'='*60}")
    print(f"✅ Incremental update done! Output: {output_path}")
    print(f"   📄 Size: {output_path.stat().st_size / 1024:.1f} KB")


def main():
    parser = argparse.ArgumentParser(description="Compile raw crawled data into product knowledge")
    parser.add_argument("--filter", type=str, default=None, help="Filter files by pattern (e.g., 'khach-hang-ca-nhan-the')")
    parser.add_argument("--output", "-o", type=str, default=str(DEFAULT_OUTPUT), help="Output file path")
    parser.add_argument("--full", action="store_true", help="Force full recompile (ignore existing compiled file)")
    args = parser.parse_args()

    output_path = Path(args.output)

    print(f"{'='*60}")
    print(f"  MSB Product Compiling Pipeline")
    print(f"  Raw dir:  {RAW_DIR}")
    print(f"  Output:   {output_path}")
    print(f"  Filter:   {args.filter or 'auto (product pages only)'}")
    print(f"{'='*60}")

    # 1. Load skill
    skill = load_skill()
    print(f"\n📋 Skill loaded: {SKILL_PATH.name}")

    # 2. Get relevant files
    files = get_product_files(args.filter)
    print(f"📂 Found {len(files)} product files")

    if not files:
        print("❌ No matching files found. Check documents/raw/ or adjust filter.")
        return

    for f in files[:10]:
        print(f"   • {f.name}")
    if len(files) > 10:
        print(f"   ... and {len(files)-10} more")

    # 3. Decide: full compile or incremental update
    if args.full or not output_path.exists():
        if not output_path.exists():
            print(f"\n📝 No existing compiled file. Running full compile...")
        else:
            print(f"\n📝 --full flag set. Running full recompile...")
        full_compile(skill, files, output_path)
    else:
        # Check for changes
        changes = detect_changes(files)
        n_changes = len(changes["added"]) + len(changes["modified"]) + len(changes["removed"])

        if n_changes == 0:
            print(f"\n✅ No changes detected. Compiled file is up-to-date.")
            return

        incremental_compile(skill, files, output_path, changes)


if __name__ == "__main__":
    main()
