"use client";

import { Clock, Heart, MessageCircle, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RouteMap } from "@/components/domain/RouteMap";
import { formatDuration } from "@/lib/format";
import type { CommunityPayload } from "@/lib/types";
import { getCommunity } from "@/services/mockRepository";
import { useLanguage } from "@/lib/LanguageContext";

export function CommunityView() {
  const [payload, setPayload] = useState<CommunityPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [filter, setFilter] = useState<"following" | "all">("following");
  const [following, setFollowing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    getCommunity()
      .then((data) => {
        if (!mounted) return;
        setPayload(data);
        setStatus("success");
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const feed = useMemo(() => payload?.feed ?? [], [payload]);

  if (status === "loading") {
    return (
      <section className="content-grid">
        <SkeletonBlock />
        <SkeletonBlock height="420px" />
      </section>
    );
  }

  if (status === "error") {
    return <EmptyState title={t("community.errorTitle")} description={t("community.errorDesc")} />;
  }

  if (!payload || feed.length === 0) {
    return <EmptyState title={t("community.emptyTitle")} description={t("community.emptyDesc")} />;
  }

  return (
    <section aria-labelledby="community-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="community-title">
            {t("community.title")}
          </h2>
          <p>{t("community.subtitle")}</p>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Feed filter">
          <button aria-checked={filter === "following"} className="segmented__item" onClick={() => setFilter("following")} role="radio" type="button">
            {t("community.filter.following")}
          </button>
          <button aria-checked={filter === "all"} className="segmented__item" onClick={() => setFilter("all")} role="radio" type="button">
            {t("community.filter.all")}
          </button>
        </div>
      </div>

      <div className="content-grid content-grid--three">
        <aside className="content-grid" aria-label={t("community.title")}>
          <Card className="activity-card">
            <span className="user-avatar">LD</span>
            <h2>Lâm Demo</h2>
            <div className="card-grid">
              <div>
                <strong>{payload.profileSummary.following}</strong>
                <p className="muted">{t("community.profile.following")}</p>
              </div>
              <div>
                <strong>{payload.profileSummary.followers}</strong>
                <p className="muted">{t("community.profile.followers")}</p>
              </div>
              <div>
                <strong>{payload.profileSummary.activities}</strong>
                <p className="muted">{t("community.profile.activities")}</p>
              </div>
              <div>
                <strong>{payload.profileSummary.streakDays}</strong>
                <p className="muted">{t("community.profile.streak")}</p>
              </div>
            </div>
          </Card>
          <Card className="activity-card">
            <h2>{t("community.clubs")}</h2>
            {payload.clubs.map((club) => (
              <div className="inline-actions" key={club.id}>
                <StatusBadge>{club.name}</StatusBadge>
              </div>
            ))}
          </Card>
        </aside>

        <div className="content-grid">
          {feed.map((activity) => (
            <article className="card card--padded activity-card" key={activity.id}>
              <header className="inline-actions">
                <span className="user-avatar">{activity.athleteName.slice(0, 1)}</span>
                <div>
                  <h2>{activity.athleteName}</h2>
                  <p className="muted">{activity.title}</p>
                </div>
                <StatusBadge tone="orange">{activity.sport}</StatusBadge>
              </header>
              <p>{activity.description}</p>
              <div className="card-grid">
                <div>
                  <strong>{activity.distanceKm} km</strong>
                  <p className="muted">{t("community.distance")}</p>
                </div>
                <div>
                  <strong>{activity.pace}</strong>
                  <p className="muted">{t("community.pace")}</p>
                </div>
                <div>
                  <strong>{activity.durationSeconds ? formatDuration(activity.durationSeconds) : "N/A"}</strong>
                  <p className="muted">{t("community.time")}</p>
                </div>
              </div>
              <RouteMap points={activity.routePoints} title={`Route map ${activity.title}`} />
              <footer className="inline-actions">
                <Button size="sm" type="button" variant="ghost">
                  <Heart size={16} />
                  {t("community.kudos")}
                </Button>
                <Button size="sm" type="button" variant="ghost">
                  <MessageCircle size={16} />
                  {t("community.comment")}
                </Button>
              </footer>
            </article>
          ))}
        </div>

        <aside className="content-grid" aria-label={t("community.suggestions")}>
          <Card className="activity-card">
            <h2>{t("community.challenges")}</h2>
            {payload.challenges.map((challenge) => (
              <div key={challenge.id}>
                <strong>{challenge.title}</strong>
                <p className="muted">
                  {challenge.progress}/{challenge.target} {t("community.challenges.days")}
                </p>
              </div>
            ))}
          </Card>
          <Card className="activity-card">
            <h2>{t("community.suggestions")}</h2>
            <div className="inline-actions">
              <span className="user-avatar">AN</span>
              <div>
                <strong>An Nhiên</strong>
                <p className="muted">Cycling · Zone 2</p>
              </div>
              <Button onClick={() => setFollowing(true)} size="sm" type="button" variant={following ? "subtle" : "primary"}>
                <UserPlus size={16} />
                {following ? t("community.following") : t("community.follow")}
              </Button>
            </div>
          </Card>
          <Card className="activity-card">
            <Clock aria-hidden="true" />
            <p className="muted">
              {t("community.filterCurrent").replace(
                "{filter}",
                filter === "following" ? t("community.filter.following") : t("community.filter.all")
              )}
            </p>
          </Card>
        </aside>
      </div>
    </section>
  );
}
