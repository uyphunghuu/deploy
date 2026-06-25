"use client";

import { PlugZap, RefreshCw } from "lucide-react";
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
import { apiRequest } from "@/services/apiClient";

export function DevicesAppsView() {
  const [items, setItems] = useState<Integration[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [pending, setPending] = useState<Integration | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    Promise.all([
      getIntegrations(),
      apiRequest<Record<string, { connected: boolean; athlete_id?: string }>>("/integrations").catch(() => ({}))
    ])
      .then(([mockData, realData]) => {
        const merged = mockData.map(item => {
          if (realData[item.provider]) {
            return {
              ...item,
              status: realData[item.provider].connected ? "connected" : "not-connected",
            } as Integration;
          }
          return item;
        });
        setItems(merged);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function change(provider: IntegrationProvider, nextStatus: Integration["status"]) {
    if (provider === "strava" && nextStatus === "connected") {
      setStatus("loading");
      try {
        const { url } = await apiRequest<{ url: string }>("/integrations/strava/login");
        window.location.href = url;
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
      return;
    }
    
    setStatus("loading");
    const next = await setIntegrationStatus(provider, nextStatus);
    setItems(items.map(i => i.provider === provider ? next.find(x => x.provider === provider)! : i));
    setStatus("success");
    setPending(null);
  }

  async function handleSync(provider: string) {
    if (provider !== "strava") return;
    setSyncing(true);
    try {
      const res = await apiRequest<{ message: string }>("/integrations/strava/sync", { method: "POST" });
      alert(res.message);
    } catch (err: any) {
      alert("Lỗi đồng bộ: " + (err.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  }

  if (status === "loading" && items.length === 0) return <SkeletonBlock height="420px" />;
  if (status === "error") return <EmptyState title="Không tải được tích hợp" description="Có lỗi xảy ra khi tải dữ liệu." />;

  return (
    <section aria-labelledby="devices-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="devices-title">
            Devices & Apps
          </h2>
          <p>Mô phỏng Garmin và Coros. Kết nối Strava là thật.</p>
        </div>
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
                    <div className="flex gap-2">
                      {item.provider === "strava" && (
                        <Button onClick={() => handleSync(item.provider)} size="sm" type="button" disabled={syncing}>
                          <RefreshCw size={14} className={syncing ? "animate-spin mr-1" : "mr-1"} /> 
                          {syncing ? "Đang đồng bộ..." : "Đồng bộ"}
                        </Button>
                      )}
                      <Button onClick={() => setPending(item)} size="sm" type="button" variant="ghost">
                        Disconnect
                      </Button>
                    </div>
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
          <p className="muted">Bạn muốn ngắt kết nối {pending ? providerLabel(pending.provider) : "provider"}?</p>
          <Button onClick={() => pending && change(pending.provider, "not-connected")} type="button" variant="danger">
            Disconnect
          </Button>
        </div>
      </Modal>
    </section>
  );
}

