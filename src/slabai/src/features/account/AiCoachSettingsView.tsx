"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { copy } from "@/lib/copy";

type Vibe = "casual" | "professional";
type Explanation = "short" | "detailed";

export function AiCoachSettingsView() {
  const [vibe, setVibe] = useState<Vibe>("professional");
  const [explanation, setExplanation] = useState<Explanation>("detailed");
  const [status, setStatus] = useState("Saved");

  function autosave(callback: () => void) {
    callback();
    setStatus("Saving...");
    window.setTimeout(() => setStatus("Saved"), 500);
  }

  return (
    <section aria-labelledby="coach-settings-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="coach-settings-title">
            AI Coach Settings
          </h2>
          <p>Điều chỉnh giọng điệu và mức giải thích của coach demo.</p>
        </div>
        <StatusBadge tone="success">{status}</StatusBadge>
      </div>
      <div className="content-grid">
        <Card className="form-stack">
          <h2>Coach vibe</h2>
          <SegmentedControl
            label="Coach vibe"
            onChange={(value) => autosave(() => setVibe(value))}
            options={[
              { label: "Casual", value: "casual" },
              { label: "Professional", value: "professional" }
            ]}
            value={vibe}
          />
        </Card>
        <Card className="form-stack">
          <h2>Explanation style</h2>
          <SegmentedControl
            label="Explanation style"
            onChange={(value) => autosave(() => setExplanation(value))}
            options={[
              { label: "Short", value: "short" },
              { label: "Detailed", value: "detailed" }
            ]}
            value={explanation}
          />
          <p className="muted">{copy.trust}</p>
        </Card>
      </div>
    </section>
  );
}
