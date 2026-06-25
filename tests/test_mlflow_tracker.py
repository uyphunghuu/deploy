"""
Unit tests for src/mlflow_tracker.py

Test mọi path: MLflow available, MLflow not installed, MLflow server down.
Chạy: pytest tests/test_mlflow_tracker.py -v
"""
import pytest
from unittest.mock import MagicMock, patch

from src.mlflow_tracker import AgentTracker, calculate_cost


# ═══════════════════════════════════════════════════════════════════════════════
# calculate_cost — pure function
# ═══════════════════════════════════════════════════════════════════════════════

class TestCalculateCost:

    def test_gpt4o_cost(self):
        """gpt-4o: $0.005/1K prompt + $0.015/1K completion."""
        cost = calculate_cost("gpt-4o", prompt_tokens=1000, completion_tokens=1000)
        assert cost == pytest.approx(0.020, rel=1e-3)

    def test_gpt4o_mini_much_cheaper(self):
        """gpt-4o-mini phải rẻ hơn gpt-4o đáng kể."""
        cost_4o      = calculate_cost("gpt-4o",      1000, 1000)
        cost_4o_mini = calculate_cost("gpt-4o-mini", 1000, 1000)
        assert cost_4o_mini < cost_4o
        assert cost_4o / cost_4o_mini > 10  # ít nhất 10x rẻ hơn

    def test_zero_tokens_costs_nothing(self):
        cost = calculate_cost("gpt-4o", prompt_tokens=0, completion_tokens=0)
        assert cost == 0.0

    def test_unknown_model_falls_back_to_gpt4o(self):
        """Model không biết phải dùng pricing của gpt-4o (không crash)."""
        cost_unknown = calculate_cost("some-future-model", 1000, 1000)
        cost_4o      = calculate_cost("gpt-4o",            1000, 1000)
        assert cost_unknown == cost_4o

    def test_cost_is_float(self):
        cost = calculate_cost("gpt-4o", 500, 200)
        assert isinstance(cost, float)

    def test_cost_non_negative(self):
        cost = calculate_cost("gpt-4o", 100, 50)
        assert cost >= 0


# ═══════════════════════════════════════════════════════════════════════════════
# AgentTracker — MLflow not installed (graceful degradation)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAgentTrackerNoMLflow:
    """Khi mlflow không được cài, tracker phải hoạt động như no-op."""

    def test_disabled_when_mlflow_not_installed(self):
        with patch("builtins.__import__", side_effect=ImportError("No module named 'mlflow'")):
            tracker = AgentTracker()
        assert tracker.enabled is False

    def test_all_methods_are_noop_when_disabled(self):
        tracker = AgentTracker.__new__(AgentTracker)
        tracker._enabled = False
        tracker._mlflow = None
        tracker._active_run = None
        tracker.experiment_name = "test"

        # Không được raise exception
        assert tracker.start_run("test-run") is None
        tracker.log_params({"model": "gpt-4o"})
        tracker.log_metrics({"tokens": 100.0})
        tracker.log_eval_scores({"qa_correctness": 1.0})
        tracker.log_text("hello", "file.txt")
        tracker.log_dict({"key": "val"}, "file.json")
        tracker.set_tags({"env": "test"})
        tracker.end_run()
        assert tracker.get_run_id() is None


# ═══════════════════════════════════════════════════════════════════════════════
# AgentTracker — MLflow available (mock)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAgentTrackerWithMLflow:
    """Khi mlflow có sẵn, tracker phải gọi đúng MLflow API."""

    @pytest.fixture
    def mock_mlflow(self):
        """Fixture trả về mock mlflow module và tracker đã setup."""
        mock_mlflow_module = MagicMock()

        # Mock run info
        mock_run = MagicMock()
        mock_run.info.run_id = "run_test_abc123"
        mock_mlflow_module.start_run.return_value = mock_run

        with patch.dict("sys.modules", {"mlflow": mock_mlflow_module}):
            tracker = AgentTracker(experiment_name="test-experiment")
            tracker._mlflow = mock_mlflow_module
            tracker._enabled = True
            yield tracker, mock_mlflow_module

    def test_enabled_when_mlflow_available(self, mock_mlflow):
        tracker, _ = mock_mlflow
        assert tracker.enabled is True

    def test_start_run_returns_run_id(self, mock_mlflow):
        tracker, mlflow_mod = mock_mlflow
        run_id = tracker.start_run(run_name="test-run")
        mlflow_mod.start_run.assert_called_once_with(
            run_name="test-run", tags={}
        )
        assert run_id == "run_test_abc123"

    def test_log_params_calls_mlflow(self, mock_mlflow):
        tracker, mlflow_mod = mock_mlflow
        params = {"model": "gpt-4o", "temperature": 0.0}
        tracker.log_params(params)
        mlflow_mod.log_params.assert_called_once_with(params)

    def test_log_metrics_calls_mlflow(self, mock_mlflow):
        tracker, mlflow_mod = mock_mlflow
        metrics = {"total_tokens": 230.0, "cost_usd": 0.0023}
        tracker.log_metrics(metrics)
        mlflow_mod.log_metrics.assert_called_once_with(metrics, step=None)

    def test_log_eval_scores_adds_eval_prefix(self, mock_mlflow):
        """eval scores phải được prefix với 'eval_'."""
        tracker, mlflow_mod = mock_mlflow
        tracker.log_eval_scores({"qa_correctness": 1.0, "hallucination": 0.0})
        called_metrics = mlflow_mod.log_metrics.call_args[0][0]
        assert "eval_qa_correctness" in called_metrics
        assert "eval_hallucination"  in called_metrics
        assert "qa_correctness" not in called_metrics  # không có prefix thô

    def test_end_run_calls_mlflow(self, mock_mlflow):
        tracker, mlflow_mod = mock_mlflow
        mock_run = MagicMock()
        mock_run.info.run_id = "run_test_abc123"
        tracker._active_run = mock_run

        tracker.end_run()
        mlflow_mod.end_run.assert_called_once_with(status="FINISHED")
        assert tracker._active_run is None

    def test_end_run_failed_status(self, mock_mlflow):
        tracker, mlflow_mod = mock_mlflow
        mock_run = MagicMock()
        tracker._active_run = mock_run

        tracker.end_run(status="FAILED")
        mlflow_mod.end_run.assert_called_once_with(status="FAILED")

    def test_get_run_id_before_start(self, mock_mlflow):
        tracker, _ = mock_mlflow
        tracker._active_run = None
        assert tracker.get_run_id() is None

    def test_context_manager_ends_run_on_success(self, mock_mlflow):
        tracker, mlflow_mod = mock_mlflow
        mock_run = MagicMock()
        tracker._active_run = mock_run

        with tracker:
            pass  # no exception

        mlflow_mod.end_run.assert_called_once_with(status="FINISHED")

    def test_context_manager_ends_run_on_exception(self, mock_mlflow):
        tracker, mlflow_mod = mock_mlflow
        mock_run = MagicMock()
        tracker._active_run = mock_run

        with pytest.raises(ValueError):
            with tracker:
                raise ValueError("something went wrong")

        mlflow_mod.end_run.assert_called_once_with(status="FAILED")

    def test_mlflow_error_does_not_crash_tracker(self, mock_mlflow):
        """Nếu MLflow server down, tracker không được crash workflow chính."""
        tracker, mlflow_mod = mock_mlflow
        mlflow_mod.log_metrics.side_effect = Exception("Connection refused")

        # Phải không raise exception
        tracker.log_metrics({"tokens": 100.0})


# ═══════════════════════════════════════════════════════════════════════════════
# Integration: tracker + agent workflow (end-to-end mock)
# ═══════════════════════════════════════════════════════════════════════════════

class TestTrackerIntegrationWithAgent:

    def test_full_experiment_run_flow(self, monkeypatch):
        """
        Simulate toàn bộ experiment tracking flow:
        start_run → log_params → run agent → log_metrics → log_eval → end_run
        """
        import json
        from unittest.mock import patch, MagicMock
        from src import config

        monkeypatch.setattr(config, "OPENAI_API_KEY", "sk-test-fake")

        # Mock OpenAI
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "PROD-102 is out of stock."
        mock_response.choices[0].message.tool_calls = None
        mock_response.usage.prompt_tokens     = 150
        mock_response.usage.completion_tokens = 60
        mock_response.usage.total_tokens      = 210

        # Mock tracker
        mock_tracker = MagicMock()
        mock_tracker.enabled = True

        with patch("src.agent.OpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_openai_cls.return_value = mock_client
            mock_client.chat.completions.create.return_value = mock_response

            from src.agent import run_agent_workflow

            result = run_agent_workflow(
                user_query="Is PROD-102 in stock?",
                model="gpt-4o-mini",
                prompt_version="v2",
                temperature=0.3,
                tracker=mock_tracker,
            )

        # Kiểm tra tracker được gọi đúng
        mock_tracker.log_params.assert_called_once()
        params = mock_tracker.log_params.call_args[0][0]
        assert params["model"] == "gpt-4o-mini"
        assert params["prompt_version"] == "v2"
        assert params["temperature"] == 0.3

        mock_tracker.log_metrics.assert_called_once()
        metrics = mock_tracker.log_metrics.call_args[0][0]
        assert metrics["total_tokens"] == 210.0
        assert metrics["cost_usd"] >= 0

        # Kiểm tra result
        assert result["token_usage"]["total_tokens"] == 210
        assert "cost_usd" in result
