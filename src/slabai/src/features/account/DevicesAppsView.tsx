"use client";

import { PlugZap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { providerLabel } from "@/lib/format";
import type { Integration, IntegrationProvider } from "@/lib/types";
import { getIntegrations, setIntegrationStatus } from "@/services/mockRepository";

export function DevicesAppsView() {
  const [items, setItems] = useState<Integration[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [pending, setPending] = useState<Integration | null>(null);

  useEffect(() => {
    getIntegrations()
      .then((data) => {
        setItems(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function change(provider: IntegrationProvider, nextStatus: Integration["status"]) {
    setStatus("loading");
    const next = await setIntegrationStatus(provider, nextStatus);
    setItems(next);
    setStatus("success");
    setPending(null);
  }

  if (status === "loading" && items.length === 0) return <SkeletonBlock height="420px" />;
  if (status === "error") return <EmptyState title="Không tải được tích hợp" description="Mock repository trả lỗi." />;

  return (
    <section aria-labelledby="devices-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="devices-title">
            Devices & Apps
          </h2>
          <p>Mô phỏng kết nối Garmin, Strava và Coros. Không gọi provider thật.</p>
        </div>
        <StatusBadge>Mock integrations</StatusBadge>
      </div>
      <Card className="table-card">
        <table className="data-table">
          <caption className="sr-only">Integration connections</caption>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.provider}>
                <td data-label="Provider">
                  <span className="inline-actions">
                    <PlugZap size={18} />
                    {providerLabel(item.provider)}
                  </span>
                </td>
                <td data-label="Status">
                  <StatusBadge tone={item.status === "connected" ? "success" : item.status === "error" ? "orange" : "blue"}>
                    {item.status}
                  </StatusBadge>
                </td>
                <td data-label="Permissions">{item.permissions.length ? item.permissions.join(", ") : "No permissions yet"}</td>
                <td data-label="Action">
                  {item.status === "connected" ? (
                    <Button onClick={() => setPending(item)} size="sm" type="button" variant="ghost">
                      Disconnect
                    </Button>
                  ) : (
                    <Button onClick={() => change(item.provider, "connected")} size="sm" type="button">
                      Connect
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={Boolean(pending)} title="Disconnect integration" onClose={() => setPending(null)}>
        <div className="form-stack">
          <p className="muted">Bạn muốn ngắt kết nối {pending ? providerLabel(pending.provider) : "provider"} trong mock UI?</p>
          <Button onClick={() => pending && change(pending.provider, "not-connected")} type="button" variant="danger">
            Disconnect
          </Button>
        </div>
      </Modal>
    </section>
  );
}
