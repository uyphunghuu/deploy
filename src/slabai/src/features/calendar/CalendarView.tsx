"use client";

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { BedDouble, ChevronLeft, ChevronRight, Dumbbell, Footprints } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RouteMap } from "@/components/domain/RouteMap";
import type { CalendarPayload, CommunityPayload, Workout } from "@/lib/types";
import { getCalendar, getCommunity } from "@/services/mockRepository";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function buildCalendarDays(month: Date, range?: CalendarPayload["range"]) {
  const rangeStart = range ? parseISO(range.from) : null;
  const showReferenceRange = Boolean(range && rangeStart && isSameMonth(rangeStart, month));
  const start = showReferenceRange && range ? parseISO(range.from) : startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = showReferenceRange && range ? parseISO(range.to) : endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function eventTone(workout: Workout) {
  const classes = ["event-card", `event-card--${workout.sport}`];
  if (workout.sport === "rest") classes.push("event-card--rest");
  if (workout.status === "completed") classes.push("event-card--completed");
  return classes.join(" ");
}

function WorkoutIcon({ workout }: { workout: Workout }) {
  if (workout.sport === "strength") return <Dumbbell aria-hidden="true" size={14} />;
  if (workout.sport === "rest") return <BedDouble aria-hidden="true" size={15} />;
  return <Footprints aria-hidden="true" size={14} />;
}

function formatDay(day: Date, lang: string) {
  return format(day, "d MMM", { locale: lang === "vi" ? vi : enUS }).toUpperCase();
}

export function CalendarView() {
  const [payload, setPayload] = useState<CalendarPayload | null>(null);
  const [community, setCommunity] = useState<CommunityPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<Workout | null>(null);
  const { lang, t } = useLanguage();

  const getSportText = (s: string, trans: (k: string) => string) => {
    if (s === "running") return trans("insights.running");
    if (s === "cycling") return trans("insights.cycling");
    if (s === "swimming") return trans("insights.swimming");
    if (s === "rest") return trans("calendar.restDay");
    if (s === "strength") return trans("calendar.strength");
    return s;
  };

  useEffect(() => {
    let mounted = true;
    setStatus("loading");
    Promise.all([getCalendar(), getCommunity()])
      .then(([calendarData, communityData]) => {
        if (!mounted) return;
        setPayload(calendarData);
        setCommunity(communityData);
        setStatus("success");
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const workouts = useMemo(() => {
    return payload?.workouts ?? [];
  }, [payload]);

  const days = buildCalendarDays(month, payload?.range);
  const rangeStart = payload ? parseISO(payload.range.from) : startOfMonth(month);

  if (status === "loading") {
    return (
      <section aria-busy="true" aria-label={t("calendar.loading")} className="content-grid">
        <SkeletonBlock />
        <SkeletonBlock height="520px" />
      </section>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title={t("calendar.errorTitle")}
        description={t("calendar.errorDesc")}
        action={
          <Button onClick={() => window.location.reload()} type="button">
            {t("calendar.reload")}
          </Button>
        }
      />
    );
  }

  return (
    <section aria-labelledby="calendar-title" className="calendar-page">
      <h2 className="sr-only" id="calendar-title">
        {t("nav.calendar")}
      </h2>

      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="toolbar calendar-toolbar" aria-label="Calendar toolbar">
            <div className="toolbar__group calendar-toolbar__date">
              <div style={{ maxWidth: "140px" }}>
                <Field
                  aria-label={t("calendar.selectDate")}
                  label={t("calendar.selectDate")}
                  type="date"
                  value={format(month, "yyyy-MM-dd")}
                  onChange={(event) => {
                    if (event.target.value) {
                      setMonth(parseISO(event.target.value));
                    }
                  }}
                  style={{
                    height: "36px",
                    minHeight: "36px",
                    padding: "4px 8px",
                    fontSize: "var(--slabai-font-sm)"
                  }}
                />
              </div>
              <Button aria-label={t("calendar.prevMonth")} iconOnly onClick={() => setMonth((value) => subMonths(value, 1))} type="button" variant="ghost">
                <ChevronLeft size={18} />
              </Button>
              <Button aria-label={t("calendar.nextMonth")} iconOnly onClick={() => setMonth((value) => addMonths(value, 1))} type="button" variant="ghost">
                <ChevronRight size={18} />
              </Button>
              <Button onClick={() => setMonth(new Date())} type="button" variant="subtle">
                {t("calendar.today")}
              </Button>
            </div>
          </div>

          {payload?.workouts.length === 0 ? (
            <EmptyState title={t("calendar.noWorkouts")} description={t("calendar.noWorkoutsDesc")} />
          ) : workouts.length === 0 ? (
            <EmptyState title={t("calendar.noResults")} description={t("calendar.noResultsDesc")} />
          ) : (
            <div className="month-scroll">
              <div className="calendar-weekdays" aria-hidden="true">
                {weekdayLabels.map((label) => (
                  <span key={label}>{t(`calendar.weekday.${label.toLowerCase()}`)}</span>
                ))}
              </div>
              <div className="month-grid" role="grid" aria-label={t("calendar.monthView")}>
                {days.map((day) => {
                  const dayWorkouts = workouts.filter((workout) => isSameDay(parseISO(workout.date), day));
                  return (
                    <div
                      className="month-cell"
                      data-muted={!isSameMonth(day, month)}
                      data-today={isSameDay(day, new Date())}
                      key={day.toISOString()}
                      role="gridcell"
                    >
                      <span className="month-cell__date">{formatDay(day, lang)}</span>
                       {dayWorkouts.length === 0 ? (
                        <div className="event-card event-card--rest" style={{ opacity: 0.6 }}>
                          <span className="event-card__meta">
                            <BedDouble aria-hidden="true" size={15} />
                            {t("calendar.rest")}
                          </span>
                        </div>
                      ) : (
                        dayWorkouts.map((workout) => (
                          <button className={eventTone(workout)} key={workout.id} onClick={() => setSelected(workout)} type="button">
                            <span className="event-card__meta">
                              <WorkoutIcon workout={workout} />
                              {workout.durationMinutes ? `${workout.durationMinutes}:00` : t("calendar.rest")}
                            </span>
                            <strong>{workout.title === "Rest" ? t("calendar.rest") : workout.title}</strong>
                          </button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="activity-rail calendar-rail" aria-label={t("calendar.communityActivities")}>
          <Card className="calendar-friends-card">
            <div style={{ fontSize: "0.85em" }}>
              <div className="calendar-card-header">
                <h2 style={{ fontSize: "1.15rem" }}>{t("calendar.friendSuggestions")}</h2>
                <Button size="sm" type="button" variant="ghost" style={{ fontSize: "0.85rem", padding: "2px 6px", height: "auto" }}>
                  {t("calendar.findFriends")}
                </Button>
              </div>
              <div className="friend-row" style={{ marginTop: "var(--slabai-space-2)" }}>
                <span className="user-avatar" style={{ width: "28px", height: "28px", minWidth: "28px", fontSize: "10px" }}>BT</span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Bảo Trang</strong>
                  <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>{t("calendar.newRunner")}</p>
                </div>
                <Button size="sm" type="button" variant="subtle" style={{ padding: "4px 8px", fontSize: "0.75rem", height: "auto" }}>
                  {t("calendar.follow")}
                </Button>
              </div>
            </div>

            <hr style={{ margin: "var(--slabai-space-4) 0", border: 0, borderTop: "1px solid var(--slabai-neutral-200)" }} />

            <div style={{ display: "grid", gap: "var(--slabai-space-4)" }}>
              <h2 style={{ fontSize: "var(--slabai-font-md)", fontWeight: 800 }}>{t("calendar.communityActivities")}</h2>
              {community?.feed.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: "grid",
                    gap: "var(--slabai-space-2)",
                    padding: "var(--slabai-space-3)",
                    border: "1px solid var(--slabai-neutral-200)",
                    borderRadius: "var(--slabai-radius-md)",
                    background: "var(--slabai-neutral-50)"
                  }}
                >
                  <div className="calendar-card-header" style={{ padding: 0 }}>
                    <StatusBadge tone="orange">{getSportText(activity.sport, t)}</StatusBadge>
                    <span className="muted">{format(parseISO(activity.occurredAt), "HH:mm")}</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: "var(--slabai-font-md)" }}>{activity.title}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: "var(--slabai-font-sm)" }}>
                    {activity.athleteName} · {activity.pace} · {activity.distanceKm} km
                  </p>
                  <RouteMap points={activity.routePoints} title={t("calendar.mapTitle").replace("{title}", activity.title)} />
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <Modal open={Boolean(selected)} title={selected?.title === "Rest" ? t("calendar.rest") : (selected?.title ?? t("calendar.workout"))} onClose={() => setSelected(null)}>
        {selected && (
          <div className="form-stack">
            <StatusBadge>{t("calendar." + selected.status)}</StatusBadge>
            <p>{format(parseISO(selected.date), "EEEE, d MMMM yyyy", { locale: lang === "vi" ? vi : enUS })}</p>
            <p className="muted">
              {selected.durationMinutes ? `${selected.durationMinutes} ${t("calendar.minutes")}` : t("calendar.noDuration")} · {selected.intensity ?? getSportText(selected.sport, t)}
            </p>
          </div>
        )}
      </Modal>

    </section>
  );
}
