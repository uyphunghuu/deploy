"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { copy } from "@/lib/copy";
import { useLanguage } from "@/lib/LanguageContext";

type Vibe = "casual" | "professional";
type Explanation = "short" | "detailed";

export function AiCoachSettingsView() {
  const [vibe, setVibe] = useState<Vibe>("professional");
  const [explanation, setExplanation] = useState<Explanation>("detailed");
  const { t } = useLanguage();
  const [status, setStatus] = useState("Saved");

  function autosave(callback: () => void) {
    callback();
    setStatus("Saving...");
    window.setTimeout(() => setStatus("Saved"), 500);
  }

  const getStatusText = (statusVal: string) => {
    if (statusVal === "Saving...") return t("coach.saving");
    if (statusVal === "Saved") return t("coach.saved");
    return statusVal;
  };

  return (
    <section aria-labelledby="coach-settings-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="coach-settings-title">
            {t("coach.title")}
          </h2>
          <p>{t("coach.subtitle")}</p>
        </div>
        <StatusBadge tone="success">{getStatusText(status)}</StatusBadge>
      </div>
      <div className="content-grid">
        <Card className="form-stack">
          <h2>{t("coach.vibe")}</h2>
          <SegmentedControl
            label={t("coach.vibe")}
            onChange={(value) => autosave(() => setVibe(value))}
            options={[
              { label: t("coach.vibe.casual"), value: "casual" },
              { label: t("coach.vibe.professional"), value: "professional" }
            ]}
            value={vibe}
          />
        </Card>
        <Card className="form-stack">
          <h2>{t("coach.style")}</h2>
          <SegmentedControl
            label={t("coach.style")}
            onChange={(value) => autosave(() => setExplanation(value))}
            options={[
              { label: t("coach.style.short"), value: "short" },
              { label: t("coach.style.detailed"), value: "detailed" }
            ]}
            value={explanation}
          />
          <p className="muted">{copy.trust}</p>
        </Card>
      </div>
    </section>
  );
}
