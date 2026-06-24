# Guardrails — AI Safety Layer

Hàng rào bảo vệ AI cho SlabAI Agent, sử dụng **llm-guard** (Protect AI).

## Kiến Trúc

```
User Query
    ↓
[1] input_guard.py  ← PromptInjection | Toxicity | TokenLimit | BanTopics
    ↓ (if safe)
[2] backend/routers/chat.py → AI Agent → LLM Response
    ↓
[3] output_guard.py ← Toxicity | Sensitive (auto-redact) | BanTopics
    ↓
Final Response to User
```

## Cài đặt

```bash
pip install llm-guard
```

> **Lưu ý**: llm-guard sẽ tải model NLP (~400MB) lần đầu. 
> Nếu không cài, guardrails tự động fallback về basic pattern-checking.

## Modules

### `policy.py` — Cấu hình tập trung
Thay đổi tất cả ngưỡng và giới hạn tại đây:
- `prompt_injection_threshold`: 0.75
- `toxicity_threshold`: 0.75
- `rate_limit_per_minute`: 10
- `blocked_input_topics`: danh sách chủ đề cấm

### `input_guard.py` — Bảo vệ Input

| Scanner | Mục đích |
|---------|---------|
| `PromptInjection` | Phát hiện jailbreak / override system prompt |
| `Toxicity` | Phát hiện nội dung độc hại, thù ghét |
| `TokenLimit` | Giới hạn độ dài query |
| `BanTopics` | Chặn chủ đề cấm (vũ khí, hack, ...) |

### `output_guard.py` — Bảo vệ Output

| Scanner | Mục đích |
|---------|---------|
| `Toxicity` | Lọc output độc hại |
| `Sensitive` | Auto-redact PII (tên, SĐT, ...) |
| `BanTopics` | Ngăn AI đề cập chủ đề cấm trong response |
| `LanguageSame` | Đảm bảo AI trả lời cùng ngôn ngữ với user |

### `rate_limiter.py` — Rate Limiting

- Sliding window, in-memory
- Max **10 requests/phút** mỗi IP/user
- Max **200 requests/ngày** mỗi IP/user
- Thread-safe

## Chạy Tests

```bash
# Từ project root
python -m pytest guardrails/tests/ -v
```

## Mở rộng

Để thêm scanner mới, sửa `input_guard.py` hoặc `output_guard.py`:

```python
from llm_guard.input_scanners import Secrets   # Ví dụ: phát hiện API keys

scanners = [
    ...
    Secrets(),   # Thêm scanner mới vào list
]
```
