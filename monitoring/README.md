# Monitoring Stack — SlabAI

Stack monitoring miễn phí, kết hợp hai công cụ bổ sung nhau:

| Tool | Port | Mục đích |
|------|------|---------|
| **Langfuse** | `3001` | LLM-native: traces, prompts, evals, chi phí token |
| **Prometheus** | `9090` | Scrape system metrics từ backend |
| **Grafana** | `3002` | Dashboard visualize metrics từ Prometheus |

## Khởi động

### Yêu cầu
- Docker Desktop đang chạy

### Chạy toàn bộ stack

```bash
# Từ project root
docker-compose -f monitoring/docker-compose.yml up -d
```

### Kiểm tra status

```bash
docker-compose -f monitoring/docker-compose.yml ps
```

### Dừng

```bash
docker-compose -f monitoring/docker-compose.yml down
```

## Truy cập

### Langfuse — LLM Observability
- URL: http://localhost:3001
- Đăng ký tài khoản lần đầu tại đây
- Tạo Project → lấy `LANGFUSE_PUBLIC_KEY` và `LANGFUSE_SECRET_KEY`
- Xem traces, evaluation scores, token costs

### Prometheus — Raw Metrics
- URL: http://localhost:9090
- Query ví dụ: `api_requests_total`, `api_request_latency_seconds`

### Grafana — Dashboards
- URL: http://localhost:3002
- User: `admin` / Pass: `admin` (đổi ngay sau lần đầu đăng nhập)
- Dashboard **SlabAI Agent Dashboard** được tự động import

## Tích hợp Langfuse vào Backend

### 1. Cài package

```bash
pip install langfuse
```

### 2. Thêm keys vào `.env`

```env
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=http://localhost:3001
```

### 3. Sử dụng trong code

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Tạo trace cho mỗi request
trace = langfuse.trace(name="chat-request", input={"query": user_query})
span = trace.span(name="agent-run")
span.end(output={"response": final_answer})
```

## Grafana Dashboard Panels

| Panel | Metric | Ngưỡng cảnh báo |
|-------|--------|----------------|
| Request Rate | `api_requests_total` | > 100 req/s |
| Avg Latency p95 | `api_request_latency_seconds` | > 3s |
| Guardrail Blocks | `guardrail_blocks_total` | > 10/hr |
| Error Rate | `5xx status codes` | > 5% |
