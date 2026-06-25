"use client";

import { Bike, Check, Dumbbell, Footprints, Save, SlidersHorizontal, Waves } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectField } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fitnessSchema, raceSchema, thresholdSchema } from "@/lib/validation";
import { planSteps, routes } from "@/lib/routes";
import type { FitnessGoal, PlanPreferences, RaceGoal, Sport } from "@/lib/types";
import { generatePlan, getPlanPreferences, savePlanPreferences } from "@/services/mockRepository";

type Step = "sport" | "goals" | "schedule" | "advanced" | "review";
type GoalMode = PlanPreferences["goalMode"];

const sportOptions: Array<{ value: Sport; label: string; icon: typeof Footprints; description: string }> = [
  {
    value: "running",
    label: "Running",
    icon: Footprints,
    description: "Run fitness development. Focus: aerobic development, HIIT and strength endurance."
  },
  {
    value: "cycling",
    label: "Cycling",
    icon: Bike,
    description: "Cycling plan with endurance rides, aerobic work and controlled intensity."
  },
  {
    value: "swimming",
    label: "Swimming",
    icon: Waves,
    description: "Swim plan with technique, aerobic sets and recovery balance."
  }
];

const defaultRace: RaceGoal = {
  id: "race_demo",
  eventType: "10K",
  raceName: "SLABAI Demo Race",
  date: "2026-10-18",
  priority: "A"
};

function updateRace(race: RaceGoal, key: keyof RaceGoal, value: string): RaceGoal {
  if (key === "priority") {
    return { ...race, priority: value as RaceGoal["priority"] };
  }
  return { ...race, [key]: value };
}

export function PlanBuilderView({ step, initialMode }: { step: Step; initialMode?: GoalMode }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanPreferences | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [thresholdSport, setThresholdSport] = useState<Sport>("running");

  useEffect(() => {
    let mounted = true;
    getPlanPreferences().then((data) => {
      if (!mounted) return;
      setPlan(initialMode ? { ...data, goalMode: initialMode } : data);
    });
    return () => {
      mounted = false;
    };
  }, [initialMode]);

  if (!plan) {
    return <div className="skeleton wizard-shell__skeleton" />;
  }

  const planValue = plan;
  const currentIndex = ["sport", "goals", "schedule", "advanced", "review"].indexOf(step) + 1;

  function update(next: Partial<PlanPreferences>) {
    setPlan((current) => (current ? { ...current, ...next } : current));
  }

  async function persist(nextRoute: string) {
    setSaving(true);
    await savePlanPreferences(planValue);
    setSaving(false);
    router.push(nextRoute);
  }

  function validateGoals(): boolean {
    if (planValue.goalMode === "fitness") {
      const result = fitnessSchema.safeParse(planValue.fitnessGoal);
      if (!result.success) {
        setError(result.error.errors[0]?.message ?? "Kiểm tra lại fitness goal.");
        return false;
      }
    } else {
      if (planValue.races.length === 0) {
        setError("Thêm ít nhất một race goal.");
        return false;
      }
      const result = raceSchema.safeParse(planValue.races[0]);
      if (!result.success) {
        setError(result.error.errors[0]?.message ?? "Kiểm tra lại race goal.");
        return false;
      }
    }
    setError("");
    return true;
  }

  function validateAdvanced(): boolean {
    const result = thresholdSchema.safeParse(planValue.thresholds);
    if (!result.success) {
      setError("Threshold cần nằm trong phạm vi hợp lệ.");
      return false;
    }
    setError("");
    return true;
  }

  async function nextFromGoals() {
    if (validateGoals()) await persist(routes.planSchedule);
  }

  async function nextFromAdvanced() {
    if (validateAdvanced()) await persist(routes.planReview);
  }

  async function generate() {
    setSaving(true);
    setError("");
    try {
      await savePlanPreferences(planValue);
      await generatePlan();
      router.push(routes.calendar);
    } catch {
      setError("Không thể generate plan mock. Thử lại sau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="wizard-shell" aria-labelledby="plan-title">
      <header className="page-header">
        <div>
          <h2 className="page-title" id="plan-title">
            Training Preferences
          </h2>
          <p>Let&apos;s build your personalized training plan together.</p>
        </div>
        <Link className="sl-button sl-button--ghost" href={routes.calendar}>
          End Plan
        </Link>
      </header>

      <nav className="step-tabs" aria-label="Plan Builder steps">
        {planSteps.map((item, index) => {
          const stepName = item.label.toLowerCase();
          const active =
            (step === "sport" && stepName === "sport") ||
            (step === "goals" && stepName === "goals") ||
            (step === "schedule" && stepName === "schedule") ||
            (step === "advanced" && stepName === "advanced") ||
            (step === "review" && stepName === "review");
          return (
            <Link aria-current={active ? "step" : undefined} className="step-tab" href={item.href} key={item.href}>
              {index < currentIndex ? <Check size={16} /> : <span>{index + 1}</span>}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {error && <div className="alert" role="alert">{error}</div>}

      {step === "sport" && (
        <Card className="activity-card">
          <h2>Sport Selection *</h2>
          <div className="option-grid">
            {sportOptions.map((sport) => {
              const Icon = sport.icon;
              return (
                <button
                  aria-pressed={plan.sport === sport.value}
                  className="option-card"
                  key={sport.value}
                  onClick={() => update({ sport: sport.value })}
                  type="button"
                >
                  <Icon size={28} />
                  {sport.label}
                </button>
              );
            })}
          </div>
          <div className="surface-muted card--padded">
            <StatusBadge>{sportOptions.find((sport) => sport.value === plan.sport)?.label} Training</StatusBadge>
            <p>{sportOptions.find((sport) => sport.value === plan.sport)?.description}</p>
          </div>
          <WizardFooter
            label="Step 1 of 5 — Sport"
            nextLabel="Next"
            onNext={() => persist(`${routes.planGoals}?mode=${plan.goalMode}`)}
            saving={saving}
          />
        </Card>
      )}

      {step === "goals" && (
        <Card className="activity-card">
          <SegmentedControl
            label="Goal mode"
            onChange={(value) => update({ goalMode: value })}
            options={[
              { label: "Race goal", value: "race" },
              { label: "Fitness goal", value: "fitness" }
            ]}
            value={plan.goalMode}
          />
          {plan.goalMode === "race" ? (
            <RaceGoalEditor plan={plan} update={update} />
          ) : (
            <FitnessGoalEditor plan={plan} update={update} />
          )}
          <WizardFooter
            backHref={routes.planSport}
            label="Step 2 of 5 — Goals"
            nextLabel="Next"
            onNext={nextFromGoals}
            saving={saving}
          />
        </Card>
      )}

      {step === "schedule" && (
        <Card className="activity-card">
          <h2>Training volume</h2>
          <div className="option-grid">
            {(["low", "mid", "high"] as const).map((volume) => (
              <button
                className="option-card"
                data-selected={plan.volume === volume}
                key={volume}
                onClick={() => update({ volume })}
                type="button"
              >
                <strong>{volume === "low" ? "Low" : volume === "mid" ? "Mid" : "High"}</strong>
                <span className="muted">
                  {volume === "low" ? "3 buổi/tuần" : volume === "mid" ? "4-5 buổi/tuần" : "6 buổi/tuần"}
                </span>
              </button>
            ))}
          </div>
          <div className="surface-muted card--padded">
            <h3>AI-optimized schedule</h3>
            <p className="muted">SLABAI sắp lịch demo dựa trên volume và mục tiêu, không đưa ra lời khuyên y tế.</p>
          </div>
          <WizardFooter
            backHref={`${routes.planGoals}?mode=${plan.goalMode}`}
            label="Step 3 of 5 — Schedule"
            nextLabel="Next"
            onNext={() => persist(routes.planAdvanced)}
            saving={saving}
          />
        </Card>
      )}

      {step === "advanced" && (
        <Card className="activity-card">
          <div className="inline-actions">
            <SlidersHorizontal aria-hidden="true" />
            <h2>Advanced settings</h2>
          </div>
          <SegmentedControl
            label="Threshold sport"
            onChange={setThresholdSport}
            options={[
              { label: "Running", value: "running" },
              { label: "Cycling", value: "cycling" },
              { label: "Swimming", value: "swimming" }
            ]}
            value={thresholdSport}
          />
          <div className="card-grid">
            <Field
              label="Heart-rate threshold"
              min={80}
              onChange={(event) =>
                update({ thresholds: { ...plan.thresholds, heartRateBpm: Number(event.target.value) } })
              }
              type="number"
              value={plan.thresholds.heartRateBpm ?? 174}
            />
            <Field
              label="Pace threshold (sec/km)"
              min={150}
              onChange={(event) =>
                update({ thresholds: { ...plan.thresholds, paceSecondsPerKm: Number(event.target.value) } })
              }
              type="number"
              value={plan.thresholds.paceSecondsPerKm ?? 322}
            />
            <Field
              label="Power threshold"
              min={50}
              onChange={(event) =>
                update({ thresholds: { ...plan.thresholds, powerWatts: Number(event.target.value) } })
              }
              type="number"
              value={plan.thresholds.powerWatts ?? 280}
            />
          </div>
          <SelectField
            label="Build progression"
            onChange={(event) => update({ buildProgression: event.target.value as PlanPreferences["buildProgression"] })}
            options={[
              { label: "Maintain", value: "maintain" },
              { label: "Normal", value: "normal" },
              { label: "Aggressive", value: "aggressive" }
            ]}
            value={plan.buildProgression}
          />
          <WizardFooter
            backHref={routes.planSchedule}
            label="Step 4 of 5 — Advanced"
            nextLabel="Review"
            onNext={nextFromAdvanced}
            saving={saving}
          />
        </Card>
      )}

      {step === "review" && (
        <Card className="activity-card">
          <StatusBadge tone="success">Ready to generate</StatusBadge>
          <h2>Review your plan</h2>
          <div className="card-grid">
            <ReviewItem href={routes.planSport} label="Sport" value={plan.sport} />
            <ReviewItem href={`${routes.planGoals}?mode=${plan.goalMode}`} label="Goals" value={plan.goalMode} />
            <ReviewItem href={routes.planSchedule} label="Volume" value={plan.volume} />
            <ReviewItem href={routes.planAdvanced} label="Progression" value={plan.buildProgression} />
          </div>
          <p className="muted">Generate plan stores a deterministic mock plan and routes to Calendar.</p>
          <WizardFooter
            backHref={routes.planAdvanced}
            label="Step 5 of 5 — Review"
            nextLabel="Generate plan"
            onNext={generate}
            saving={saving}
          />
        </Card>
      )}
    </section>
  );
}

function RaceGoalEditor({
  plan,
  update
}: {
  plan: PlanPreferences;
  update: (next: Partial<PlanPreferences>) => void;
}) {
  const races = plan.races.length > 0 ? plan.races : [defaultRace];
  const race = races[0] ?? defaultRace;

  function setRace(key: keyof RaceGoal, value: string) {
    update({ races: [updateRace(race, key, value), ...races.slice(1)] });
  }

  return (
    <div className="form-stack">
      <h2>Race goals</h2>
      <div className="card-grid">
        <SelectField
          label="Event type"
          onChange={(event) => setRace("eventType", event.target.value)}
          options={[
            { label: "5K", value: "5K" },
            { label: "10K", value: "10K" },
            { label: "Half Marathon", value: "Half Marathon" },
            { label: "Triathlon", value: "Triathlon" }
          ]}
          value={race.eventType}
        />
        <Field label="Race name" onChange={(event) => setRace("raceName", event.target.value)} value={race.raceName} />
        <Field label="Date" onChange={(event) => setRace("date", event.target.value)} type="date" value={race.date} />
        <SelectField
          label="Priority"
          onChange={(event) => setRace("priority", event.target.value)}
          options={[
            { label: "A", value: "A" },
            { label: "B", value: "B" },
            { label: "C", value: "C" }
          ]}
          value={race.priority}
        />
      </div>
      <Button onClick={() => update({ races: [...races, { ...defaultRace, id: `race_${races.length + 1}` }] })} type="button" variant="ghost">
        Thêm race
      </Button>
    </div>
  );
}

function FitnessGoalEditor({
  plan,
  update
}: {
  plan: PlanPreferences;
  update: (next: Partial<PlanPreferences>) => void;
}) {
  const goal: FitnessGoal = plan.fitnessGoal ?? { focus: "5k", durationWeeks: 6 };
  return (
    <div className="form-stack">
      <h2>Fitness goal</h2>
      <SelectField
        label="Focus"
        onChange={(event) => update({ fitnessGoal: { ...goal, focus: event.target.value as FitnessGoal["focus"] } })}
        options={[
          { label: "5K", value: "5k" },
          { label: "10K", value: "10k" },
          { label: "Half Marathon", value: "half-marathon" },
          { label: "General Fitness", value: "general-fitness" },
          { label: "Endurance", value: "endurance" }
        ]}
        value={goal.focus}
      />
      <Field
        label="Duration weeks"
        max={24}
        min={4}
        onChange={(event) => update({ fitnessGoal: { ...goal, durationWeeks: Number(event.target.value) } })}
        type="number"
        value={goal.durationWeeks}
      />
    </div>
  );
}

function ReviewItem({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <div className="surface-muted card--padded">
      <span className="page-kicker">{label}</span>
      <strong>{value}</strong>
      <Link href={href}>Edit</Link>
    </div>
  );
}

function WizardFooter({
  label,
  nextLabel,
  onNext,
  saving,
  backHref
}: {
  label: string;
  nextLabel: string;
  onNext: () => void;
  saving: boolean;
  backHref?: string;
}) {
  return (
    <footer className="wizard-footer">
      <div>
        <span className="muted">{label}</span>
        <StatusBadge tone="success">Ready to continue</StatusBadge>
      </div>
      <div className="inline-actions">
        {backHref && (
          <Link className="sl-button sl-button--ghost" href={backHref}>
            Previous
          </Link>
        )}
        <Button loading={saving} onClick={onNext} type="button">
          <Save size={16} />
          {nextLabel}
        </Button>
      </div>
    </footer>
  );
}
