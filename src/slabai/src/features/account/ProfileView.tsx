"use client";

import { Camera, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectField } from "@/components/ui/Field";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { User } from "@/lib/types";
import { getUser, saveUser } from "@/services/mockRepository";

export function ProfileView() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "clean" | "saving" | "saved" | "error">("loading");

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

  return (
    <section aria-labelledby="profile-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="profile-title">
            Profile
          </h2>
          <p>Quản lý thông tin demo và chỉ số thể thao cơ bản.</p>
        </div>
        <StatusBadge tone={status === "error" ? "orange" : status === "saved" ? "success" : "blue"}>
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : status === "error" ? "Save error" : "Autosave"}
        </StatusBadge>
      </div>
      <div className="content-grid content-grid--two">
        <Card className="activity-card">
          <span className="user-avatar">LD</span>
          <h2>Lâm Demo</h2>
          <p className="muted">Ảnh đại diện chỉ là placeholder trong frontend phase.</p>
          <Button type="button" variant="ghost">
            <Camera size={18} />
            Upload/change photo
          </Button>
        </Card>
        <Card className="form-stack">
          <h2>Personal information</h2>
          <div className="card-grid">
            <Field label="First name" onChange={(event) => update({ firstName: event.target.value })} value={user.firstName} />
            <Field label="Last name" onChange={(event) => update({ lastName: event.target.value })} value={user.lastName} />
            <Field label="Email" readOnly type="email" value={user.email} />
            <Field label="Date of birth" onChange={(event) => update({ dateOfBirth: event.target.value })} type="date" value={user.dateOfBirth ?? ""} />
            <SelectField
              label="Gender"
              onChange={(event) => update({ gender: event.target.value as User["gender"] })}
              options={[
                { label: "Prefer not to say", value: "prefer-not-to-say" },
                { label: "Female", value: "female" },
                { label: "Male", value: "male" },
                { label: "Other", value: "other" }
              ]}
              value={user.gender}
            />
            <SelectField
              label="Primary sport"
              onChange={(event) => update({ primarySport: event.target.value as User["primarySport"] })}
              options={[
                { label: "Running", value: "running" },
                { label: "Cycling", value: "cycling" },
                { label: "Swimming", value: "swimming" }
              ]}
              value={user.primarySport}
            />
            <Field label="Height (cm)" onChange={(event) => update({ heightCm: Number(event.target.value) })} type="number" value={user.heightCm ?? 0} />
            <Field label="Weight (kg)" onChange={(event) => update({ weightKg: Number(event.target.value) })} type="number" value={user.weightKg ?? 0} />
          </div>
          <Button onClick={() => update(user)} type="button">
            <Save size={18} />
            Save now
          </Button>
        </Card>
      </div>
    </section>
  );
}
