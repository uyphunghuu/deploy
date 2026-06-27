from app.ai.running_coach.safety import build_health_note, build_scope_note


def test_build_health_note_flags_serious_symptoms() -> None:
    note = build_health_note("Tôi bị đau ngực và khó thở bất thường khi đang chạy")

    assert note is not None
    assert "serious symptom" in note


def test_build_scope_note_flags_non_running_sports() -> None:
    note = build_scope_note("Tạo cho tôi một buổi bơi 1500m")

    assert note is not None
    assert "running only" in note
