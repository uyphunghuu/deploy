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
import { vi } from "date-fns/locale";
import { BedDouble, CalendarPlus, ChevronLeft, ChevronRight, Dumbbell, Filter, Footprints, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, SelectField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RouteMap } from "@/components/domain/RouteMap";
import { formatDuration } from "@/lib/format";
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

function formatDay(day: Date) {
  return format(day, "d MMM").toUpperCase();
}

export function CalendarView() {
  const [payload, setPayload] = useState<CalendarPayload | null>(null);
  const [community, setCommunity] = useState<CommunityPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [month, setMonth] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Workout | null>(null);
  const [addOpen, setAddOpen] = useState(false);

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
    const base = payload?.workouts ?? [];
    return base.filter((workout) => {
      const matchesQuery = workout.title.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "all" || workout.sport === filter || workout.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [payload, query, filter]);

  const days = buildCalendarDays(month, payload?.range);
  const rangeStart = payload ? parseISO(payload.range.from) : startOfMonth(month);

  if (status === "loading") {
    return (
      <section aria-busy="true" aria-label="Đang tải Calendar" className="content-grid">
        <SkeletonBlock />
        <SkeletonBlock height="520px" />
      </section>
    );
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Không tải được Calendar"
        description="Dữ liệu mock đang gặp lỗi. Bạn có thể thử tải lại."
        action={
          <Button onClick={() => window.location.reload()} type="button">
            Tải lại
          </Button>
        }
      />
    );
  }

  return (
    <section aria-labelledby="calendar-title" className="calendar-page">
      <h2 className="sr-only" id="calendar-title">
        Calendar
      </h2>

      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="toolbar calendar-toolbar" aria-label="Calendar toolbar">
            <div className="toolbar__group calendar-toolbar__date">
              <Field aria-label="Ngày bắt đầu" label="Ngày bắt đầu" readOnly value={format(rangeStart, "MM/dd/yyyy")} />
              <Button onClick={() => setMonth(rangeStart)} type="button" variant="primary">
                Go
              </Button>
              <Button aria-label="Tháng trước" iconOnly onClick={() => setMonth((value) => subMonths(value, 1))} type="button" variant="ghost">
                <ChevronLeft size={18} />
              </Button>
              <Button aria-label="Tháng sau" iconOnly onClick={() => setMonth((value) => addMonths(value, 1))} type="button" variant="ghost">
                <ChevronRight size={18} />
              </Button>
              <Button onClick={() => setMonth(new Date())} type="button" variant="subtle">
                Today
              </Button>
            </div>

            <div className="toolbar__group calendar-toolbar__actions">
              <Button onClick={() => setAddOpen(true)} type="button">
                <CalendarPlus size={18} />
                Add
              </Button>
              <Field aria-label="Search" label="Search" onChange={(event) => setQuery(event.target.value)} placeholder="Tìm workout" type="search" value={query} />
              <SelectField
                label="Filter"
                onChange={(event) => setFilter(event.target.value)}
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Running", value: "running" },
                  { label: "Strength", value: "strength" },
                  { label: "Rest", value: "rest" },
                  { label: "Completed", value: "completed" }
                ]}
                value={filter}
              />
              <Button aria-label="Mở filter" type="button" variant="ghost">
                <Filter size={18} />
                Filter
              </Button>
              <Button aria-label="Tìm kiếm" type="button" variant="ghost">
                <Search size={18} />
                Search
              </Button>
            </div>
          </div>

          {payload?.workouts.length === 0 ? (
            <EmptyState title="Tháng này chưa có workout" description="Generate plan để xem lịch tập demo trong Calendar." />
          ) : workouts.length === 0 ? (
            <EmptyState title="Không có kết quả phù hợp" description="Thử xóa tìm kiếm hoặc đổi bộ lọc." />
          ) : (
            <div className="month-scroll">
              <div className="calendar-weekdays" aria-hidden="true">
                {weekdayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="month-grid" role="grid" aria-label="Lịch tháng">
                {days.map((day) => {
                  const dayWorkouts = workouts.filter((workout) => isSameDay(parseISO(workout.date), day));
                  return (
                    <div className="month-cell" data-muted={!isSameMonth(day, month)} key={day.toISOString()} role="gridcell">
                      <span className="month-cell__date">{formatDay(day)}</span>
                      {dayWorkouts.map((workout) => (
                        <button className={eventTone(workout)} key={workout.id} onClick={() => setSelected(workout)} type="button">
                          <span className="event-card__meta">
                            <WorkoutIcon workout={workout} />
                            {workout.durationMinutes ? `${workout.durationMinutes}:00` : "Rest"}
                          </span>
                          <strong>{workout.title}</strong>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="activity-rail calendar-rail" aria-label="Gợi ý kết bạn và hoạt động cộng đồng">
          <Card className="calendar-friends-card">
            <div className="calendar-card-header">
              <h2>Gợi ý kết bạn</h2>
              <Button size="sm" type="button" variant="ghost">
                Tìm bạn bè
              </Button>
            </div>
            <div className="friend-row">
              <span className="user-avatar">BT</span>
              <div>
                <strong>Bảo Trang</strong>
                <p className="muted">Runner mới tham gia</p>
              </div>
              <Button size="sm" type="button" variant="subtle">
                Theo dõi
              </Button>
            </div>
          </Card>
          {community?.feed.map((activity) => (
            <Card className="activity-card calendar-activity-card" key={activity.id}>
              <div className="calendar-card-header">
                <StatusBadge tone="orange">{activity.sport}</StatusBadge>
                <span className="muted">{format(parseISO(activity.occurredAt), "HH:mm")}</span>
              </div>
              <h3>{activity.title}</h3>
              <p className="muted">
                {activity.athleteName} · {activity.pace} · {activity.distanceKm} km
              </p>
              <RouteMap points={activity.routePoints} title={`Bản đồ hoạt động ${activity.title}`} />
            </Card>
          ))}
        </aside>
      </div>

      <Modal open={Boolean(selected)} title={selected?.title ?? "Workout"} onClose={() => setSelected(null)}>
        {selected && (
          <div className="form-stack">
            <StatusBadge>{selected.status}</StatusBadge>
            <p>{format(parseISO(selected.date), "EEEE, d MMMM yyyy", { locale: vi })}</p>
            <p className="muted">
              {selected.durationMinutes ? `${selected.durationMinutes} phút` : "Không có thời lượng"} · {selected.intensity ?? selected.sport}
            </p>
          </div>
        )}
      </Modal>

      <Modal open={addOpen} title="Add workout mock" onClose={() => setAddOpen(false)}>
        <div className="form-stack">
          <p className="muted">Prototype chỉ mô phỏng thao tác thêm workout, chưa ghi vào lịch thật.</p>
          <Field label="Tên workout" placeholder="Easy run" />
          <Field label="Thời lượng" placeholder={formatDuration(1800)} />
          <Button onClick={() => setAddOpen(false)} type="button">
            Lưu mock
          </Button>
        </div>
      </Modal>
    </section>
  );
}
