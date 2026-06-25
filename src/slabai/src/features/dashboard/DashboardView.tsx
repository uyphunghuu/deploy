"use client";

import { Activity, CalendarDays, Clock, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BackendDashboardSummary } from "@/services/backendTypes";
import { getDashboardSummary } from "@/services/dashboardRepository";

export function DashboardView() {
  const [summary, setSummary] = useState<BackendDashboardSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "empty" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    getDashboardSummary()
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
        setStatus(data.activities_count || data.upcoming_sessions_count || data.active_plans_count ? "success" : "empty");
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "loading") return <SkeletonBlock height="420px" />;

  if (status === "error") {
    return <EmptyState title="Khong tai duoc Dashboard" description="Backend hien khong tra ve du lieu tong quan." />;
  }

  if (!summary || status === "empty") {
    return <EmptyState title="Dashboard dang trong" description="Tao plan hoac them activity de xem tong quan tap luyen." />;
  }

  return (
    <section aria-labelledby="dashboard-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="dashboard-title">
            Dashboard
          </h2>
          <p>Tong quan du lieu tap luyen tu backend SLABAI.</p>
        </div>
        <StatusBadge tone="success">Live API</StatusBadge>
      </div>
      <div className="card-grid">
        <Metric icon={Activity} label="Activities" value={summary.activities_count} />
        <Metric icon={Gauge} label="Distance" value={`${summary.total_distance_km.toFixed(1)} km`} />
        <Metric icon={Clock} label="Duration" value={`${Math.round(summary.total_duration_seconds / 60)} min`} />
        <Metric icon={CalendarDays} label="Upcoming" value={summary.upcoming_sessions_count} />
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string | number }) {
  return (
    <Card className="metric-card">
      <Icon aria-hidden="true" />
      <span className="page-kicker">{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

