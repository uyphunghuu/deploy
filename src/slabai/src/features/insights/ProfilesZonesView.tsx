"use client";

import { Bot, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SelectField } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { copy } from "@/lib/copy";
import { formatPace } from "@/lib/format";
import type { InsightsPayload, Sport } from "@/lib/types";
import { getInsights } from "@/services/mockRepository";
import { useLanguage } from "@/lib/LanguageContext";

type Range = "6w" | "12w" | "24w";

export function ProfilesZonesView() {
  const [payload, setPayload] = useState<InsightsPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success" | "empty">("loading");
  const [range, setRange] = useState<Range>("6w");
  const [sport, setSport] = useState<Sport>("running");
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    getInsights()
      .then((data) => {
        if (!mounted) return;
        setPayload(data);
        setStatus(data.curve.length ? "success" : "empty");
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(
    () =>
      payload?.curve.map((point) => ({
        duration: point.durationSeconds,
        label: point.durationSeconds < 60 ? `${point.durationSeconds}s` : `${Math.round(point.durationSeconds / 60)}m`,
        pace: point.paceSecondsPerKm,
        paceLabel: formatPace(point.paceSecondsPerKm)
      })) ?? [],
    [payload]
  );

  if (status === "loading") {
    return (
      <section className="content-grid">
        <SkeletonBlock />
        <SkeletonBlock height="420px" />
      </section>
    );
  }

  if (status === "empty") {
    return <EmptyState title={t("insights.emptyTitle")} description={t("insights.emptyDesc")} />;
  }

  if (status === "error" || !payload) {
    return <EmptyState title={t("insights.errorTitle")} description={t("insights.errorDesc")} />;
  }

  const getSportText = (s: string) => {
    if (s === "running") return t("insights.running");
    if (s === "cycling") return t("insights.cycling");
    if (s === "swimming") return t("insights.swimming");
    return s;
  };

  return (
    <section aria-labelledby="insights-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="insights-title">
            {t("insights.title")}
          </h2>
          <p>{t("insights.subtitle")}</p>
        </div>
        <div className="inline-actions">
          <SelectField
            label={t("insights.sport")}
            onChange={(event) => setSport(event.target.value as Sport)}
            options={[
              { label: t("insights.running"), value: "running" },
              { label: t("insights.cycling"), value: "cycling" },
              { label: t("insights.swimming"), value: "swimming" }
            ]}
            value={sport}
          />
          <SegmentedControl
            label={t("insights.range")}
            onChange={setRange}
            options={[
              { label: "6W", value: "6w" },
              { label: "12W", value: "12w" },
              { label: "24W", value: "24w" }
            ]}
            value={range}
          />
        </div>
      </div>

      <div className="content-grid">
        <Card className="activity-card">
          <div className="inline-actions">
            <Bot aria-hidden="true" />
            <div>
              <h2>AI Coach</h2>
              <p className="muted">{t("insights.trust")}</p>
            </div>
            <Button type="button" variant="subtle">{t("insights.askCoach")}</Button>
          </div>
        </Card>

        <div className="card-grid">
          <Metric label={t("insights.aerobicThreshold")} value={payload.metrics.aerobicThresholdPace} />
          <Metric label={t("insights.threshold")} value={payload.metrics.thresholdPace} />
          <Metric label={t("insights.vo2max")} value={payload.metrics.vo2MaxPace} />
          <Metric label={t("insights.sprint")} value={payload.metrics.sprintPace} />
        </div>

        <Card className="activity-card">
          <div className="toolbar">
            <div>
              <h2>{t("insights.paceProfile")}</h2>
              <p className="muted">
                {t("insights.profileMeta").replace("{sport}", getSportText(sport)).replace("{range}", range.toUpperCase())}
              </p>
            </div>
            <Button onClick={() => setCollapsed((value) => !value)} type="button" variant="ghost">
              <ChevronUp size={18} />
              {collapsed ? t("insights.openChart") : t("insights.collapse")}
            </Button>
          </div>
          {!collapsed && (
            <>
              <div className="chart-panel" aria-hidden="true">
                <div className="chart-panel__inner">
                  <ResponsiveContainer height={320} width="100%">
                    <LineChart data={chartData} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                      <CartesianGrid stroke="var(--slabai-neutral-200)" />
                      <XAxis dataKey="label" stroke="var(--slabai-text-secondary)" />
                      <YAxis tickFormatter={formatPace} stroke="var(--slabai-text-secondary)" />
                      <Tooltip
                        formatter={(value) => formatPace(Number(value))}
                        labelFormatter={(label) => t("insights.durationLabel").replace("{label}", label)}
                      />
                      <Line dataKey="pace" dot stroke="var(--slabai-brand-blue-600)" strokeWidth={3} type="monotone" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <table className="data-table">
                <caption className="sr-only">Accessible pace profile data</caption>
                <thead>
                  <tr>
                    <th>{t("insights.duration")}</th>
                    <th>{t("insights.pace")}</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((point) => (
                    <tr key={point.duration}>
                      <td data-label={t("insights.duration")}>{point.label}</td>
                      <td data-label={t("insights.pace")}>{point.paceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="metric-card">
      <span className="page-kicker">{label}</span>
      <strong>{value}</strong>
      <StatusBadge>Zone</StatusBadge>
    </Card>
  );
}
