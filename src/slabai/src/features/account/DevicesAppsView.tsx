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
import { useLanguage } from "@/lib/LanguageContext";
import type { Integration, IntegrationProvider } from "@/lib/types";
import { getIntegrations, setIntegrationStatus } from "@/services/mockRepository";
import { apiRequest } from "@/services/apiClient";

export function DevicesAppsView() {
  const [items, setItems] = useState<Integration[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [pending, setPending] = useState<Integration | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    Promise.all([
      getIntegrations(),
      apiRequest<Record<string, { connected: boolean; athlete_id?: string }>>("/integrations").catch(() => ({}))
    ])
      .then(([mockData, realData]) => {
        const data = realData as Record<string, { connected: boolean; athlete_id?: string }>;
        const merged = mockData.map(item => {
          if (data[item.provider]) {
            return {
              ...item,
              status: data[item.provider].connected ? "connected" : "not-connected",
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
      alert(t("devices.syncError") + (err.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  }

  if (status === "loading" && items.length === 0) return <SkeletonBlock height="420px" />;
  if (status === "error") return <EmptyState title={t("devices.errorLoading")} description={t("devices.errorLoadingDesc")} />;

  return (
    <section aria-labelledby="devices-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="devices-title">
            {t("devices.title")}
          </h2>
          <p>{t("devices.subtitle")}</p>
        </div>
      </div>
      <Card className="table-card">
        <table className="data-table">
          <caption className="sr-only">Integration connections</caption>
          <thead>
            <tr>
              <th>{t("devices.provider")}</th>
              <th>{t("devices.status")}</th>
              <th>{t("devices.permissions")}</th>
              <th>{t("devices.action")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.provider}>
                <td data-label={t("devices.provider")}>
                  <span className="inline-actions">
                    <PlugZap size={18} />
                    {providerLabel(item.provider)}
                  </span>
                </td>
                <td data-label={t("devices.status")}>
                  <StatusBadge tone={item.status === "connected" ? "success" : item.status === "error" ? "orange" : "blue"}>
                    {item.status === "connected"
                      ? t("devices.connected")
                      : item.status === "not-connected"
                      ? t("devices.notConnected")
                      : item.status === "connecting"
                      ? t("devices.connecting")
                      : t("devices.error")}
                  </StatusBadge>
                </td>
                <td data-label={t("devices.permissions")}>
                  {item.permissions.length ? item.permissions.join(", ") : t("devices.noPermissions")}
                </td>
                <td data-label={t("devices.action")}>
                  {item.status === "connected" ? (
                    <div className="flex gap-2">
                      {item.provider === "strava" && (
                        <Button onClick={() => handleSync(item.provider)} size="sm" type="button" disabled={syncing}>
                          <RefreshCw size={14} className={syncing ? "animate-spin mr-1" : "mr-1"} /> 
                          {syncing ? t("devices.syncing") : t("devices.sync")}
                        </Button>
                      )}
                      <Button onClick={() => setPending(item)} size="sm" type="button" variant="ghost">
                        {t("devices.disconnect")}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => change(item.provider, "connected")} size="sm" type="button">
                      {t("devices.connect")}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={Boolean(pending)} title={t("devices.disconnectTitle")} onClose={() => setPending(null)}>
        <div className="form-stack">
          <p className="muted">
            {t("devices.disconnectConfirm").replace("{provider}", pending ? providerLabel(pending.provider) : "provider")}
          </p>
          <Button onClick={() => pending && change(pending.provider, "not-connected")} type="button" variant="danger">
            {t("devices.disconnect")}
          </Button>
        </div>
      </Modal>
    </section>
  );
}

