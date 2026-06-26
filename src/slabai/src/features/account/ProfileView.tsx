"use client";

import { Camera, Save, UserRound, Dumbbell, Mail, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectField } from "@/components/ui/Field";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import type { User } from "@/lib/types";
import { getUser, saveUser } from "@/services/mockRepository";
import { useLanguage } from "@/lib/LanguageContext";

export function ProfileView() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "clean" | "saving" | "saved" | "error">("loading");
  const { t } = useLanguage();

  useEffect(() => {
    getUser().then((data) => {
      setUser(data);
      setStatus("clean");
    });
  }, []);

  async function update(next: Partial<User>) {
    if (!user) return;
    const nextUser = { ...user, ...next };
    setUser(nextUser);
    setStatus("saving");
    try {
      await saveUser(nextUser);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (!user) return <SkeletonBlock height="420px" />;

  // Calculate BMI dynamically if valid
  const bmi = user.weightKg && user.heightCm && user.heightCm > 0
    ? (user.weightKg / Math.pow(user.heightCm / 100, 2)).toFixed(1)
    : "N/A";

  const getSportText = (sport: string) => {
    if (sport === "running") return t("profile.sport.running");
    if (sport === "cycling") return t("profile.sport.cycling");
    if (sport === "swimming") return t("profile.sport.swimming");
    return sport;
  };

  return (
    <section aria-labelledby="profile-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="profile-title">
            {t("profile.title")}
          </h2>
          <p>{t("profile.subtitle")}</p>
        </div>
        <div className="pulse-badge">
          <span className={`pulse-dot ${
            status === "saved" ? "pulse-dot--success" : 
            status === "saving" ? "pulse-dot--saving" : ""
          }`} />
          <span style={{ fontSize: "var(--slabai-font-sm)", fontWeight: 600, color: "var(--slabai-text-secondary)" }}>
            {status === "saving" 
              ? t("profile.saving") 
              : status === "saved" 
              ? t("profile.saved") 
              : status === "error" 
              ? t("profile.saveError") 
              : t("profile.autosave")}
          </span>
        </div>
      </div>

      <div className="profile-view-layout">
        {/* Left Side: Avatar Card */}
        <div className="profile-card-left">
          <div className="profile-card-banner" />
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-circle">
              {user.firstName ? user.firstName.charAt(0) : "U"}
              {user.lastName ? user.lastName.charAt(0) : ""}
            </div>
            <div className="profile-upload-overlay" title={t("profile.uploadPhoto")}>
              <Camera size={24} color="white" />
            </div>
          </div>
          <h2 className="profile-user-name">{user.firstName} {user.lastName}</h2>
          <p className="profile-user-email">
            <Mail size={14} />
            {user.email}
          </p>
          <hr className="profile-divider" />
          
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <span>{t("profile.primarySport")}</span>
              <strong>{getSportText(user.primarySport)}</strong>
            </div>
            <div className="profile-stat-box" title="Body Mass Index">
              <span>BMI</span>
              <strong>{bmi}</strong>
            </div>
          </div>
          <p className="muted" style={{ fontSize: "var(--slabai-font-xs)", textAlign: "center", padding: "0 var(--slabai-space-4) var(--slabai-space-4) var(--slabai-space-4)", margin: 0 }}>
            {t("profile.avatarPlaceholder")}
          </p>
        </div>

        {/* Right Side: Form Configuration */}
        <Card className="form-stack" style={{ padding: "var(--slabai-space-6)" }}>
          <div className="profile-section-header">
            <UserRound size={20} />
            <h3>{t("profile.personalInfo")}</h3>
          </div>
          
          <div className="card-grid">
            <Field label={t("profile.firstName")} onChange={(event) => update({ firstName: event.target.value })} value={user.firstName} />
            <Field label={t("profile.lastName")} onChange={(event) => update({ lastName: event.target.value })} value={user.lastName} />
            <div style={{ position: "relative" }}>
              <Field label={t("profile.email")} readOnly type="email" value={user.email} style={{ paddingRight: "36px", background: "var(--slabai-bg-subtle)", cursor: "not-allowed" }} />
              <Lock size={14} style={{ position: "absolute", right: "12px", bottom: "12px", color: "var(--slabai-text-secondary)" }} />
            </div>
            <Field label={t("profile.dob")} onChange={(event) => update({ dateOfBirth: event.target.value })} type="date" value={user.dateOfBirth ?? ""} />
            <SelectField
              label={t("profile.gender")}
              onChange={(event) => update({ gender: event.target.value as User["gender"] })}
              options={[
                { label: t("profile.gender.none"), value: "prefer-not-to-say" },
                { label: t("profile.gender.female"), value: "female" },
                { label: t("profile.gender.male"), value: "male" },
                { label: t("profile.gender.other"), value: "other" }
              ]}
              value={user.gender}
            />
          </div>

          <div className="profile-section-header">
            <Dumbbell size={20} />
            <h3>{t("profile.primarySport")} & {t("devices.status")}</h3>
          </div>

          <div className="card-grid">
            <SelectField
              label={t("profile.primarySport")}
              onChange={(event) => update({ primarySport: event.target.value as User["primarySport"] })}
              options={[
                { label: t("profile.sport.running"), value: "running" },
                { label: t("profile.sport.cycling"), value: "cycling" },
                { label: t("profile.sport.swimming"), value: "swimming" }
              ]}
              value={user.primarySport}
            />
            <Field label={t("profile.height")} onChange={(event) => update({ heightCm: Number(event.target.value) })} type="number" value={user.heightCm ?? 0} />
            <Field label={t("profile.weight")} onChange={(event) => update({ weightKg: Number(event.target.value) })} type="number" value={user.weightKg ?? 0} />
          </div>

          <div style={{ marginTop: "var(--slabai-space-6)", display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => update(user)} type="button" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Save size={18} />
              {t("profile.save")}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
