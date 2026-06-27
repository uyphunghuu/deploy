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
import { useLanguage } from "@/lib/LanguageContext";

type Step = "sport" | "goals" | "schedule" | "advanced" | "review";
type GoalMode = PlanPreferences["goalMode"];

const wizardTranslations = {
  vi: {
    title: "Cấu hình Luyện tập",
    subtitle: "Hãy cùng xây dựng kế hoạch tập luyện cá nhân hóa của riêng bạn.",
    endPlan: "Thoát thiết lập",
    sportTitle: "Chọn môn thể thao *",
    goalMode: "Chế độ mục tiêu",
    raceGoal: "Mục tiêu giải đấu",
    fitnessGoal: "Mục tiêu thể chất",
    trainingVolume: "Khối lượng tập luyện",
    aiSchedule: "Lịch trình tối ưu bởi AI",
    aiScheduleDesc: "SLABAI sắp lịch demo dựa trên volume và mục tiêu, không đưa ra lời khuyên y tế.",
    advancedTitle: "Thiết lập nâng cao",
    thresholdSport: "Môn thể thao ngưỡng",
    hrThreshold: "Ngưỡng nhịp tim (bpm)",
    paceThreshold: "Ngưỡng Pace (giây/km)",
    powerThreshold: "Ngưỡng công suất (Watts)",
    buildProgression: "Mức độ tăng tải",
    readyGenerate: "Sẵn sàng khởi tạo",
    reviewTitle: "Xem lại kế hoạch",
    reviewDesc: "Khởi tạo kế hoạch sẽ lưu cấu hình demo và chuyển hướng tới Lịch tập.",
    generateButton: "Khởi tạo kế hoạch",
    eventType: "Loại sự kiện",
    raceName: "Tên giải đấu",
    date: "Ngày diễn ra",
    priority: "Mức ưu tiên",
    addRace: "Thêm giải đấu",
    focus: "Mục tiêu tập trung",
    durationWeeks: "Số tuần thực hiện",
    edit: "Chỉnh sửa",
    readyContinue: "Sẵn sàng tiếp tục",
    previous: "Quay lại",
    next: "Tiếp theo",
    review: "Xem lại",
    step1: "Bước 1 trên 5 — Chọn môn",
    step2: "Bước 2 trên 5 — Mục tiêu",
    step3: "Bước 3 trên 5 — Lịch trình",
    step4: "Bước 4 trên 5 — Nâng cao",
    step5: "Bước 5 trên 5 — Xem lại",
    // validations
    errFitness: "Kiểm tra lại fitness goal.",
    errAddRace: "Thêm ít nhất một race goal.",
    errRace: "Kiểm tra lại race goal.",
    errThreshold: "Threshold cần nằm trong phạm vi hợp lệ.",
    errGenerate: "Không thể khởi tạo kế hoạch. Thử lại sau.",
    // volumes
    sessionsPerWeek: "buổi/tuần",
    sportOptions: {
      running: {
        label: "Chạy bộ",
        desc: "Phát triển thể chất chạy bộ. Tập trung: phát triển hiếu khí, chạy biến tốc (HIIT) và sức bền cơ bắp."
      },
      cycling: {
        label: "Đạp xe",
        desc: "Kế hoạch đạp xe với các bài chạy bền, phát triển hiếu khí và cường độ kiểm soát."
      },
      swimming: {
        label: "Bơi lội",
        desc: "Kế hoạch bơi tập trung vào kỹ thuật, các tổ bơi hiếu khí và cân bằng phục hồi."
      }
    },
    progressions: {
      maintain: "Duy trì",
      normal: "Bình thường",
      aggressive: "Tăng tải mạnh"
    }
  },
  en: {
    title: "Training Preferences",
    subtitle: "Let's build your personalized training plan together.",
    endPlan: "End Plan",
    sportTitle: "Sport Selection *",
    goalMode: "Goal mode",
    raceGoal: "Race goal",
    fitnessGoal: "Fitness goal",
    trainingVolume: "Training volume",
    aiSchedule: "AI-optimized schedule",
    aiScheduleDesc: "SLABAI schedules a demo based on volume and goals, not medical advice.",
    advancedTitle: "Advanced settings",
    thresholdSport: "Threshold sport",
    hrThreshold: "Heart-rate threshold",
    paceThreshold: "Pace threshold (sec/km)",
    powerThreshold: "Power threshold",
    buildProgression: "Build progression",
    readyGenerate: "Ready to generate",
    reviewTitle: "Review your plan",
    reviewDesc: "Generate plan stores a deterministic mock plan and routes to Calendar.",
    generateButton: "Generate plan",
    eventType: "Event type",
    raceName: "Race name",
    date: "Date",
    priority: "Priority",
    addRace: "Add race",
    focus: "Focus",
    durationWeeks: "Duration weeks",
    edit: "Edit",
    readyContinue: "Ready to continue",
    previous: "Previous",
    next: "Next",
    review: "Review",
    step1: "Step 1 of 5 — Sport",
    step2: "Step 2 of 5 — Goals",
    step3: "Step 3 of 5 — Schedule",
    step4: "Step 4 of 5 — Advanced",
    step5: "Step 5 of 5 — Review",
    // validations
    errFitness: "Please check your fitness goal.",
    errAddRace: "Add at least one race goal.",
    errRace: "Please check your race goal.",
    errThreshold: "Threshold needs to be in a valid range.",
    errGenerate: "Cannot generate mock plan. Try again later.",
    // volumes
    sessionsPerWeek: "sessions/week",
    sportOptions: {
      running: {
        label: "Running",
        desc: "Run fitness development. Focus: aerobic development, HIIT and strength endurance."
      },
      cycling: {
        label: "Cycling",
        desc: "Cycling plan with endurance rides, aerobic work and controlled intensity."
      },
      swimming: {
        label: "Swimming",
        desc: "Swim plan with technique, aerobic sets and recovery balance."
      }
    },
    progressions: {
      maintain: "Maintain",
      normal: "Normal",
      aggressive: "Aggressive"
    }
  }
};

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

function formatFitnessFocus(focus: FitnessGoal["focus"], lang: "vi" | "en") {
  const labels: Record<FitnessGoal["focus"], string> = {
    "5k": "5K",
    "10k": "10K",
    "half-marathon": "Half Marathon",
    "general-fitness": lang === "vi" ? "Thể lực tổng quát" : "General Fitness",
    endurance: lang === "vi" ? "Sức bền" : "Endurance"
  };
  return labels[focus];
}

function getGoalReview(plan: PlanPreferences, lang: "vi" | "en") {
  if (plan.goalMode === "race") {
    const race = plan.races[0];
    if (!race) {
      return {
        value: lang === "vi" ? "Chưa có race goal" : "No race goal",
        details: []
      };
    }
    return {
      value: race.raceName,
      details: [
        race.eventType,
        race.date,
        `${lang === "vi" ? "Ưu tiên" : "Priority"} ${race.priority}`
      ]
    };
  }

  const goal = plan.fitnessGoal ?? { focus: "5k", durationWeeks: 6 };
  const weeks = lang === "vi" ? `${goal.durationWeeks} tuần` : `${goal.durationWeeks} weeks`;
  return {
    value: formatFitnessFocus(goal.focus, lang),
    details: [weeks]
  };
}

function getVolumeReview(volume: PlanPreferences["volume"], lang: "vi" | "en") {
  const labels = {
    low: {
      value: lang === "vi" ? "Thấp" : "Low",
      details: [lang === "vi" ? "3 buổi/tuần" : "3 sessions/week"]
    },
    mid: {
      value: lang === "vi" ? "Vừa" : "Mid",
      details: [lang === "vi" ? "4-5 buổi/tuần" : "4-5 sessions/week"]
    },
    high: {
      value: lang === "vi" ? "Cao" : "High",
      details: [lang === "vi" ? "6 buổi/tuần" : "6 sessions/week"]
    }
  };
  return labels[volume];
}

function getAdvancedReview(plan: PlanPreferences, progressionLabel: string) {
  const details = [
    plan.thresholds.heartRateBpm ? `HR ${plan.thresholds.heartRateBpm} bpm` : null,
    plan.thresholds.paceSecondsPerKm ? `Pace ${plan.thresholds.paceSecondsPerKm}s/km` : null,
    plan.thresholds.powerWatts ? `Power ${plan.thresholds.powerWatts}W` : null
  ].filter(Boolean);

  return {
    value: progressionLabel,
    details
  };
}

export function PlanBuilderView({ step, initialMode }: { step: Step; initialMode?: GoalMode }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanPreferences | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [thresholdSport, setThresholdSport] = useState<Sport>("running");
  
  const { lang } = useLanguage();
  const t = (key: keyof typeof wizardTranslations["vi"]) => {
    return wizardTranslations[lang][key] as any;
  };

  const sportOptions = [
    {
      value: "running" as Sport,
      label: t("sportOptions").running.label,
      icon: Footprints,
      description: t("sportOptions").running.desc
    },
    {
      value: "cycling" as Sport,
      label: t("sportOptions").cycling.label,
      icon: Bike,
      description: t("sportOptions").cycling.desc
    },
    {
      value: "swimming" as Sport,
      label: t("sportOptions").swimming.label,
      icon: Waves,
      description: t("sportOptions").swimming.desc
    }
  ];

  const tabLabels = [
    lang === "vi" ? "Môn thể thao" : "Sport",
    lang === "vi" ? "Mục tiêu" : "Goals",
    lang === "vi" ? "Lịch trình" : "Schedule",
    lang === "vi" ? "Nâng cao" : "Advanced",
    lang === "vi" ? "Xem lại" : "Review"
  ];

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
  const goalReview = getGoalReview(plan, lang);
  const volumeReview = getVolumeReview(plan.volume, lang);
  const advancedReview = getAdvancedReview(plan, t("progressions")[plan.buildProgression] || plan.buildProgression);

  function update(next: Partial<PlanPreferences>) {
    setPlan((current) => {
      if (!current) return current;
      const nextPlan = { ...current, ...next };
      try {
        window.localStorage.setItem("slabai-plan-preferences-draft", JSON.stringify(nextPlan));
      } catch {
        // Ignore storage errors; the in-memory wizard state still updates.
      }
      return nextPlan;
    });
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
        setError(result.error.errors[0]?.message ?? t("errFitness"));
        return false;
      }
    } else {
      if (planValue.races.length === 0) {
        setError(t("errAddRace"));
        return false;
      }
      const result = raceSchema.safeParse(planValue.races[0]);
      if (!result.success) {
        setError(result.error.errors[0]?.message ?? t("errRace"));
        return false;
      }
    }
    setError("");
    return true;
  }

  function validateAdvanced(): boolean {
    const result = thresholdSchema.safeParse(planValue.thresholds);
    if (!result.success) {
      setError(t("errThreshold"));
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
      setError(t("errGenerate"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="wizard-shell" aria-labelledby="plan-title">
      <header className="page-header">
        <div>
          <h2 className="page-title" id="plan-title">
            {t("title")}
          </h2>
          <p>{t("subtitle")}</p>
        </div>
        <Link className="sl-button sl-button--ghost" href={routes.calendar}>
          {t("endPlan")}
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
              {tabLabels[index]}
            </Link>
          );
        })}
      </nav>

      {error && <div className="alert" role="alert">{error}</div>}

      {step === "sport" && (
        <Card className="activity-card">
          <h2>{t("sportTitle")}</h2>
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
            <StatusBadge>{sportOptions.find((sport) => sport.value === plan.sport)?.label} {lang === "vi" ? "Luyện tập" : "Training"}</StatusBadge>
            <p>{sportOptions.find((sport) => sport.value === plan.sport)?.description}</p>
          </div>
          <WizardFooter
            label={t("step1")}
            nextLabel={t("next")}
            onNext={() => persist(`${routes.planGoals}?mode=${plan.goalMode}`)}
            saving={saving}
          />
        </Card>
      )}

      {step === "goals" && (
        <Card className="activity-card">
          <SegmentedControl
            label={t("goalMode")}
            onChange={(value) => update({ goalMode: value })}
            options={[
              { label: t("raceGoal"), value: "race" },
              { label: t("fitnessGoal"), value: "fitness" }
            ]}
            value={plan.goalMode}
          />
          {plan.goalMode === "race" ? (
            <RaceGoalEditor plan={plan} update={update} t={t} />
          ) : (
            <FitnessGoalEditor plan={plan} update={update} t={t} />
          )}
          <WizardFooter
            backHref={routes.planSport}
            label={t("step2")}
            nextLabel={t("next")}
            onNext={nextFromGoals}
            saving={saving}
          />
        </Card>
      )}

      {step === "schedule" && (
        <Card className="activity-card">
          <h2>{t("trainingVolume")}</h2>
          <div className="option-grid">
            {(["low", "mid", "high"] as const).map((volume) => (
              <button
                className="option-card"
                data-selected={plan.volume === volume}
                key={volume}
                onClick={() => update({ volume })}
                type="button"
              >
                <strong>{volume === "low" ? (lang === "vi" ? "Thấp" : "Low") : volume === "mid" ? (lang === "vi" ? "Vừa" : "Mid") : (lang === "vi" ? "Cao" : "High")}</strong>
                <span className="muted">
                  {volume === "low" ? `3 ${t("sessionsPerWeek")}` : volume === "mid" ? `4-5 ${t("sessionsPerWeek")}` : `6 ${t("sessionsPerWeek")}`}
                </span>
              </button>
            ))}
          </div>
          <div className="surface-muted card--padded">
            <h3>{t("aiSchedule")}</h3>
            <p className="muted">{t("aiScheduleDesc")}</p>
          </div>
          <WizardFooter
            backHref={`${routes.planGoals}?mode=${plan.goalMode}`}
            label={t("step3")}
            nextLabel={t("next")}
            onNext={() => persist(routes.planAdvanced)}
            saving={saving}
          />
        </Card>
      )}

      {step === "advanced" && (
        <Card className="activity-card">
          <div className="inline-actions">
            <SlidersHorizontal aria-hidden="true" />
            <h2>{t("advancedTitle")}</h2>
          </div>
          <SegmentedControl
            label={t("thresholdSport")}
            onChange={setThresholdSport}
            options={[
              { label: lang === "vi" ? "Chạy bộ" : "Running", value: "running" },
              { label: lang === "vi" ? "Đạp xe" : "Cycling", value: "cycling" },
              { label: lang === "vi" ? "Bơi lội" : "Swimming", value: "swimming" }
            ]}
            value={thresholdSport}
          />
          <div className="card-grid">
            <Field
              label={t("hrThreshold")}
              min={80}
              onChange={(event) =>
                update({ thresholds: { ...plan.thresholds, heartRateBpm: Number(event.target.value) } })
              }
              type="number"
              value={plan.thresholds.heartRateBpm ?? 174}
            />
            <Field
              label={t("paceThreshold")}
              min={150}
              onChange={(event) =>
                update({ thresholds: { ...plan.thresholds, paceSecondsPerKm: Number(event.target.value) } })
              }
              type="number"
              value={plan.thresholds.paceSecondsPerKm ?? 322}
            />
            <Field
              label={t("powerThreshold")}
              min={50}
              onChange={(event) =>
                update({ thresholds: { ...plan.thresholds, powerWatts: Number(event.target.value) } })
              }
              type="number"
              value={plan.thresholds.powerWatts ?? 280}
            />
          </div>
          <SelectField
            label={t("buildProgression")}
            onChange={(event) => update({ buildProgression: event.target.value as PlanPreferences["buildProgression"] })}
            options={[
              { label: t("progressions").maintain, value: "maintain" },
              { label: t("progressions").normal, value: "normal" },
              { label: t("progressions").aggressive, value: "aggressive" }
            ]}
            value={plan.buildProgression}
          />
          <WizardFooter
            backHref={routes.planSchedule}
            label={t("step4")}
            nextLabel={t("review")}
            onNext={nextFromAdvanced}
            saving={saving}
          />
        </Card>
      )}

      {step === "review" && (
        <Card className="activity-card">
          <StatusBadge tone="success">{t("readyGenerate")}</StatusBadge>
          <h2>{t("reviewTitle")}</h2>
          <div className="card-grid plan-review-grid">
            <ReviewItem href={routes.planSport} label={tabLabels[0]} value={t("sportOptions")[plan.sport]?.label || plan.sport} editLabel={t("edit")} />
            <ReviewItem href={`${routes.planGoals}?mode=${plan.goalMode}`} label={tabLabels[1]} value={goalReview.value} details={goalReview.details} editLabel={t("edit")} />
            <ReviewItem href={routes.planSchedule} label={tabLabels[2]} value={volumeReview.value} details={volumeReview.details} editLabel={t("edit")} />
            <ReviewItem href={routes.planAdvanced} label={tabLabels[3]} value={advancedReview.value} details={advancedReview.details} editLabel={t("edit")} />
          </div>
          <p className="muted">{t("reviewDesc")}</p>
          <WizardFooter
            backHref={routes.planAdvanced}
            label={t("step5")}
            nextLabel={t("generateButton")}
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
  update,
  t
}: {
  plan: PlanPreferences;
  update: (next: Partial<PlanPreferences>) => void;
  t: (key: keyof typeof wizardTranslations["vi"]) => any;
}) {
  const races = plan.races.length > 0 ? plan.races : [defaultRace];
  const race = races[0] ?? defaultRace;

  function setRace(key: keyof RaceGoal, value: string) {
    update({ races: [updateRace(race, key, value), ...races.slice(1)] });
  }

  return (
    <div className="form-stack">
      <h2>{t("raceGoal")}</h2>
      <div className="card-grid">
        <SelectField
          label={t("eventType")}
          onChange={(event) => setRace("eventType", event.target.value)}
          options={[
            { label: "5K", value: "5K" },
            { label: "10K", value: "10K" },
            { label: "Half Marathon", value: "Half Marathon" },
            { label: "Triathlon", value: "Triathlon" }
          ]}
          value={race.eventType}
        />
        <Field label={t("raceName")} onChange={(event) => setRace("raceName", event.target.value)} value={race.raceName} />
        <Field label={t("date")} onChange={(event) => setRace("date", event.target.value)} type="date" value={race.date} />
        <SelectField
          label={t("priority")}
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
        {t("addRace")}
      </Button>
    </div>
  );
}

function FitnessGoalEditor({
  plan,
  update,
  t
}: {
  plan: PlanPreferences;
  update: (next: Partial<PlanPreferences>) => void;
  t: (key: keyof typeof wizardTranslations["vi"]) => any;
}) {
  const goal: FitnessGoal = plan.fitnessGoal ?? { focus: "5k", durationWeeks: 6 };
  return (
    <div className="form-stack">
      <h2>{t("fitnessGoal")}</h2>
      <SelectField
        label={t("focus")}
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
        label={t("durationWeeks")}
        max={24}
        min={4}
        onChange={(event) => update({ fitnessGoal: { ...goal, durationWeeks: Number(event.target.value) } })}
        type="number"
        value={goal.durationWeeks}
      />
    </div>
  );
}

function ReviewItem({
  href,
  label,
  value,
  details = [],
  editLabel
}: {
  href: string;
  label: string;
  value: string;
  details?: Array<string | null>;
  editLabel: string;
}) {
  const visibleDetails = details.filter(Boolean);

  return (
    <div className="surface-muted card--padded plan-review-item">
      <div className="plan-review-item__body">
        <span className="page-kicker">{label}</span>
        <strong>{value}</strong>
        {visibleDetails.length > 0 && (
          <ul>
            {visibleDetails.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
      <Link href={href}>{editLabel}</Link>
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
  const { lang } = useLanguage();
  return (
    <footer className="wizard-footer">
      <div>
        <span className="muted">{label}</span>
        <StatusBadge tone="success">{lang === "vi" ? "Sẵn sàng tiếp tục" : "Ready to continue"}</StatusBadge>
      </div>
      <div className="inline-actions">
        {backHref && (
          <Link className="sl-button sl-button--ghost" href={backHref}>
            {lang === "vi" ? "Quay lại" : "Previous"}
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
