"""
MLflow Experiment Tracker — SlabAI Agent

Wraps MLflow tracking so agent.py và evaluation.py không phụ thuộc
trực tiếp vào MLflow. Nếu MLflow không được cài hoặc server không chạy,
module này log cảnh báo và tiếp tục mà không crash.

Cách dùng:
    from src.mlflow_tracker import AgentTracker

    tracker = AgentTracker(experiment_name="slabai-product-agent")
    run_id = tracker.start_run(run_name="gpt-4o_prompt_v1")

    tracker.log_params({
        "model": "gpt-4o",
        "prompt_version": "v1",
        "temperature": 0.0,
    })
    tracker.log_metrics({
        "prompt_tokens": 150,
        "completion_tokens": 80,
        "total_tokens": 230,
        "latency_ms": 1240.5,
        "cost_usd": 0.0023,
    })
    tracker.log_eval_scores({
        "qa_correctness": 1.0,
        "hallucination": 0.0,
        "toxicity": 0.0,
    })
    tracker.end_run()
"""
from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

# GPT-4o pricing (per 1K tokens) — update khi giá thay đổi
_COST_PER_1K = {
    "gpt-4o":       {"prompt": 0.005,  "completion": 0.015},
    "gpt-4o-mini":  {"prompt": 0.00015,"completion": 0.0006},
    "gpt-4-turbo":  {"prompt": 0.01,   "completion": 0.03},
}


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """
    Tính chi phí USD từ token usage.

    Args:
        model:             tên model OpenAI (vd "gpt-4o")
        prompt_tokens:     số tokens trong prompt
        completion_tokens: số tokens trong completion

    Returns:
        Chi phí ước tính (USD), làm tròn 6 chữ số thập phân.
    """
    pricing = _COST_PER_1K.get(model, _COST_PER_1K["gpt-4o"])
    cost = (
        (prompt_tokens     / 1000) * pricing["prompt"]
        + (completion_tokens / 1000) * pricing["completion"]
    )
    return round(cost, 6)


class AgentTracker:
    """
    Wrapper xung quanh MLflow tracking API.

    - Nếu MLflow không được cài → log warning, mọi method là no-op.
    - Nếu MLFLOW_TRACKING_URI không set → dùng local ./mlruns.
    - Thread-safe cho single-process usage.
    """

    def __init__(self, experiment_name: str = "slabai-agent") -> None:
        self.experiment_name = experiment_name
        self._mlflow = None
        self._active_run = None
        self._enabled = False
        self._setup()

    # ── Khởi tạo ──────────────────────────────────────────────────────────────

    def _setup(self) -> None:
        """Import MLflow và cấu hình tracking URI."""
        try:
            import mlflow  # noqa: PLC0415

            tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "")
            if tracking_uri:
                mlflow.set_tracking_uri(tracking_uri)
                logger.info("[MLflow] Tracking URI: %s", tracking_uri)
            else:
                logger.info("[MLflow] No MLFLOW_TRACKING_URI set — using local ./mlruns")

            mlflow.set_experiment(self.experiment_name)
            self._mlflow = mlflow
            self._enabled = True
            logger.info("[MLflow] Experiment '%s' ready.", self.experiment_name)

        except ImportError:
            logger.warning(
                "[MLflow] mlflow not installed — tracking disabled. "
                "Install with: pip install mlflow"
            )
        except Exception as exc:
            logger.warning("[MLflow] Setup failed: %s — tracking disabled.", exc)

    # ── Run lifecycle ──────────────────────────────────────────────────────────

    def start_run(self, run_name: str | None = None, tags: dict | None = None) -> str | None:
        """
        Bắt đầu một MLflow run.

        Args:
            run_name: tên gợi nhớ cho run (vd "gpt-4o_prompt_v1")
            tags:     dict tuỳ chọn để gán tag cho run

        Returns:
            run_id (str) nếu MLflow hoạt động, None nếu disabled.
        """
        if not self._enabled:
            return None
        try:
            self._active_run = self._mlflow.start_run(
                run_name=run_name,
                tags=tags or {},
            )
            run_id = self._active_run.info.run_id
            logger.info("[MLflow] Run started: %s (id=%s)", run_name, run_id)
            return run_id
        except Exception as exc:
            logger.warning("[MLflow] start_run failed: %s", exc)
            return None

    def end_run(self, status: str = "FINISHED") -> None:
        """
        Kết thúc run hiện tại.

        Args:
            status: "FINISHED" | "FAILED" | "KILLED"
        """
        if not self._enabled or self._active_run is None:
            return
        try:
            self._mlflow.end_run(status=status)
            logger.info("[MLflow] Run ended with status: %s", status)
        except Exception as exc:
            logger.warning("[MLflow] end_run failed: %s", exc)
        finally:
            self._active_run = None

    # ── Logging methods ────────────────────────────────────────────────────────

    def log_params(self, params: dict[str, Any]) -> None:
        """
        Log hyperparameters / config của run (chỉ log 1 lần per run).

        Ví dụ: model, prompt_version, temperature, history_days
        """
        if not self._enabled:
            return
        try:
            self._mlflow.log_params(params)
        except Exception as exc:
            logger.warning("[MLflow] log_params failed: %s", exc)

    def log_metrics(self, metrics: dict[str, float], step: int | None = None) -> None:
        """
        Log numeric metrics (có thể log nhiều lần để tạo đường time-series).

        Ví dụ: token counts, latency, cost
        """
        if not self._enabled:
            return
        try:
            self._mlflow.log_metrics(metrics, step=step)
        except Exception as exc:
            logger.warning("[MLflow] log_metrics failed: %s", exc)

    def log_eval_scores(self, scores: dict[str, float]) -> None:
        """
        Log kết quả evaluation (QA, hallucination, toxicity, ...).

        Prefixed với "eval_" để dễ lọc trong MLflow UI.
        Ví dụ: {"qa_correctness": 1.0} → metric "eval_qa_correctness"
        """
        if not self._enabled:
            return
        prefixed = {f"eval_{k}": v for k, v in scores.items()}
        self.log_metrics(prefixed)

    def log_text(self, text: str, artifact_filename: str) -> None:
        """
        Lưu text dạng artifact (vd nội dung plan, prompt đã dùng, response).

        Args:
            text:              nội dung text
            artifact_filename: tên file trong MLflow artifact store
        """
        if not self._enabled:
            return
        try:
            self._mlflow.log_text(text, artifact_filename)
        except Exception as exc:
            logger.warning("[MLflow] log_text failed: %s", exc)

    def log_dict(self, data: dict, artifact_filename: str) -> None:
        """
        Lưu dict dạng JSON artifact.

        Args:
            data:              dict cần lưu
            artifact_filename: tên file .json trong artifact store
        """
        if not self._enabled:
            return
        try:
            self._mlflow.log_dict(data, artifact_filename)
        except Exception as exc:
            logger.warning("[MLflow] log_dict failed: %s", exc)

    def set_tags(self, tags: dict[str, str]) -> None:
        """Gán tags cho run hiện tại."""
        if not self._enabled:
            return
        try:
            self._mlflow.set_tags(tags)
        except Exception as exc:
            logger.warning("[MLflow] set_tags failed: %s", exc)

    # ── Context manager support ────────────────────────────────────────────────

    def __enter__(self) -> "AgentTracker":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        status = "FAILED" if exc_type is not None else "FINISHED"
        self.end_run(status=status)

    # ── Utility ────────────────────────────────────────────────────────────────

    @property
    def enabled(self) -> bool:
        """Trả về True nếu MLflow đang hoạt động."""
        return self._enabled

    def get_run_id(self) -> str | None:
        """Trả về run_id của run đang chạy, hoặc None."""
        if self._active_run is None:
            return None
        return self._active_run.info.run_id
