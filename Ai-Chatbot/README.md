# MSB Sales Chatbot
cd frontend && npm run dev


## Cấu trúc dự án

```
├── src/                  # Source code
│   ├── chatbot.py        # CLI chatbot chính
│   ├── llm_clients.py    # Azure OpenAI & OpenRouter streaming clients
│   └── config.py         # Centralized config & path management
├── skills/               # System prompts (kỹ năng chatbot)
│   ├── acknowledge_validation_sale/SKILL.md
│   └── product_compiling/SKILL.md
├── documents/            # Knowledge base & eval data
│   └── msb-sale-knowledge.md
├── .env                  # API keys (không commit)
├── .env.example          # Template cho .env
├── requirements.txt      # Python dependencies
└── .gitignore
```

## Cài đặt

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Điền API keys vào .env
```

## Chạy chatbot

```bash
python -m src.chatbot
```

## Crawler (Crawl4AI)

Deep crawl bất kỳ URL nào, xuất markdown sạch vào `documents/`:

```bash
# Crawl với depth mặc định = 2
python -m src.crawler https://www.msb.com.vn/khach-hang-ca-nhan/the

# Tùy chỉnh depth và max pages
python -m src.crawler https://example.com --depth 3 --max-pages 100

# Chỉ định file output
python -m src.crawler https://example.com -o documents/my-crawl.md
```

Options:
- `--depth` (default: 2) — Số level crawl sâu từ trang gốc
- `--max-pages` (default: 50) — Số trang tối đa
- `--output / -o` — File xuất (mặc định tự sinh từ URL vào `documents/`)

## Models hỗ trợ

1. Azure OpenAI GPT-4o
2. OpenRouter Qwen 3.6 (35B)
3. OpenRouter Gemma 4
4. A/B/C Testing (cả 3 model cùng lúc)
