"""
Unit tests for src/agent.py

Không cần OPENAI_API_KEY — tất cả OpenAI calls đều được mock.
Chạy: pytest tests/test_agent.py -v
"""
import json
import pytest
from unittest.mock import MagicMock, patch

from src.agent import get_stock_status, run_agent_workflow
from src import config


# ═══════════════════════════════════════════════════════════════════════════════
# get_stock_status — pure function, không cần mock gì
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetStockStatus:

    def test_known_product_in_stock(self):
        """PROD-101 có stock > 0."""
        result = json.loads(get_stock_status("PROD-101"))
        assert result["name"] == "Premium AI Laptop"
        assert result["stock"] == 5
        assert result["price"] == "$1200"
        assert "error" not in result

    def test_known_product_out_of_stock(self):
        """PROD-102 phải trả stock = 0 (out of stock case quan trọng nhất)."""
        result = json.loads(get_stock_status("PROD-102"))
        assert result["name"] == "Wireless Noise-Cancelling Headphones"
        assert result["stock"] == 0
        assert result["price"] == "$250"
        assert "error" not in result

    def test_known_product_high_stock(self):
        """PROD-103 có stock 15."""
        result = json.loads(get_stock_status("PROD-103"))
        assert result["name"] == "Smart Watch Series 5"
        assert result["stock"] == 15
        assert "error" not in result

    def test_unknown_product_returns_error(self):
        """Product không tồn tại phải trả về error key."""
        result = json.loads(get_stock_status("PROD-999"))
        assert "error" in result
        assert "PROD-999" in result["error"]

    def test_returns_valid_json_string(self):
        """Return value phải là JSON string hợp lệ."""
        raw = get_stock_status("PROD-101")
        assert isinstance(raw, str)
        parsed = json.loads(raw)
        assert isinstance(parsed, dict)

    def test_all_known_products_have_description(self):
        """Mỗi sản phẩm phải có description."""
        for product_id in ["PROD-101", "PROD-102", "PROD-103"]:
            result = json.loads(get_stock_status(product_id))
            assert "description" in result
            assert len(result["description"]) > 0


# ═══════════════════════════════════════════════════════════════════════════════
# run_agent_workflow — mock OpenAI client
# ═══════════════════════════════════════════════════════════════════════════════

def _make_mock_response(content: str, tool_calls=None, prompt_tokens=100, completion_tokens=50):
    """Helper tạo mock OpenAI response object."""
    mock_response = MagicMock()
    mock_response.choices[0].message.content = content
    mock_response.choices[0].message.tool_calls = tool_calls
    mock_response.usage.prompt_tokens     = prompt_tokens
    mock_response.usage.completion_tokens = completion_tokens
    mock_response.usage.total_tokens      = prompt_tokens + completion_tokens
    return mock_response


def _make_mock_tool_call(product_id: str):
    """Helper tạo mock tool_call object."""
    mock_tool_call = MagicMock()
    mock_tool_call.id = "call_abc123"
    mock_tool_call.function.name = "get_stock_status"
    mock_tool_call.function.arguments = json.dumps({"product_id": product_id})
    return mock_tool_call


class TestRunAgentWorkflow:

    def test_raises_without_api_key(self, monkeypatch):
        """Phải raise ValueError rõ ràng khi thiếu API key."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "")
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            run_agent_workflow("test query")

    def test_direct_answer_without_tool_call(self, monkeypatch):
        """Khi LLM trả lời thẳng (không gọi tool), workflow vẫn hoạt động."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake-key")

        mock_response = _make_mock_response(
            content="I can help you with product queries.",
            tool_calls=None,
        )

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.return_value = mock_response

            result = run_agent_workflow("Hello!")

        assert result["response"] == "I can help you with product queries."
        assert result["token_usage"]["prompt_tokens"] == 100
        assert result["token_usage"]["completion_tokens"] == 50
        assert result["token_usage"]["total_tokens"] == 150
        assert "latency_ms" in result
        assert "cost_usd" in result

    def test_workflow_with_tool_call(self, monkeypatch):
        """2-turn workflow: LLM gọi tool → nhận kết quả → trả lời cuối."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake-key")

        # Turn 1: LLM yêu cầu gọi tool
        first_response = _make_mock_response(
            content=None,
            tool_calls=[_make_mock_tool_call("PROD-102")],
            prompt_tokens=120,
            completion_tokens=30,
        )
        # Turn 2: LLM trả lời sau khi nhận tool output
        second_response = _make_mock_response(
            content="PROD-102 is currently out of stock. Price is $250.",
            tool_calls=None,
            prompt_tokens=200,
            completion_tokens=60,
        )

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.side_effect = [
                first_response,
                second_response,
            ]

            result = run_agent_workflow("Is PROD-102 in stock?")

        assert "out of stock" in result["response"].lower()
        # Token usage phải cộng cả 2 turns
        assert result["token_usage"]["prompt_tokens"]     == 120 + 200
        assert result["token_usage"]["completion_tokens"] == 30 + 60
        assert result["token_usage"]["total_tokens"]      == 410

    def test_result_has_required_keys(self, monkeypatch):
        """Result dict phải có đủ các keys cần thiết."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake-key")

        mock_response = _make_mock_response(content="Test response.", tool_calls=None)

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.return_value = mock_response

            result = run_agent_workflow("test query")

        assert "query"       in result
        assert "response"    in result
        assert "token_usage" in result
        assert "latency_ms"  in result
        assert "cost_usd"    in result

    def test_accepts_model_parameter(self, monkeypatch):
        """Phải forward model parameter xuống OpenAI client."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake-key")

        mock_response = _make_mock_response(content="Response.", tool_calls=None)

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.return_value = mock_response

            run_agent_workflow("test query", model="gpt-4o-mini")

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        assert call_kwargs["model"] == "gpt-4o-mini"

    def test_accepts_temperature_parameter(self, monkeypatch):
        """Phải forward temperature parameter xuống OpenAI client."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake-key")

        mock_response = _make_mock_response(content="Response.", tool_calls=None)

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.return_value = mock_response

            run_agent_workflow("test query", temperature=0.7)

        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        assert call_kwargs["temperature"] == 0.7

    def test_tracker_receives_params_and_metrics(self, monkeypatch):
        """Khi truyền tracker, phải gọi log_params và log_metrics."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake-key")

        mock_response = _make_mock_response(
            content="Response.", tool_calls=None,
            prompt_tokens=100, completion_tokens=40,
        )

        mock_tracker = MagicMock()

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.return_value = mock_response

            run_agent_workflow(
                "test query",
                model="gpt-4o",
                prompt_version="v1",
                tracker=mock_tracker,
            )

        mock_tracker.log_params.assert_called_once()
        params_logged = mock_tracker.log_params.call_args[0][0]
        assert params_logged["model"] == "gpt-4o"
        assert params_logged["prompt_version"] == "v1"

        mock_tracker.log_metrics.assert_called_once()
        metrics_logged = mock_tracker.log_metrics.call_args[0][0]
        assert "prompt_tokens"     in metrics_logged
        assert "completion_tokens" in metrics_logged
        assert "latency_ms"        in metrics_logged
        assert "cost_usd"          in metrics_logged

    def test_no_tracker_still_works(self, monkeypatch):
        """tracker=None (default) không được gây lỗi gì."""
        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake-key")

        mock_response = _make_mock_response(content="Response.", tool_calls=None)

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.return_value = mock_response

            result = run_agent_workflow("test query")  # tracker=None mặc định

        assert result["response"] == "Response."
