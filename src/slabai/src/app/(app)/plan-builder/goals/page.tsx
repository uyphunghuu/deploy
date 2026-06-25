import { PlanBuilderView } from "@/features/plan-builder/PlanBuilderView";
import type { PlanPreferences } from "@/lib/types";

export default function PlanBuilderGoalsPage({ searchParams }: { searchParams: { mode?: string } }) {
  const mode: PlanPreferences["goalMode"] = searchParams.mode === "race" ? "race" : "fitness";
  return <PlanBuilderView initialMode={mode} step="goals" />;
}
