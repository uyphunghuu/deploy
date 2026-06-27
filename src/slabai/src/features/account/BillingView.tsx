"use client";

import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BillingPayload } from "@/lib/types";
import { addMockPaymentMethod, getBilling } from "@/services/mockRepository";
import { useLanguage } from "@/lib/LanguageContext";

export function BillingView() {
  const [payload, setPayload] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    getBilling().then((data) => {
      setPayload(data);
      setLoading(false);
    });
  }, []);

  async function addPayment() {
    setLoading(true);
    const next = await addMockPaymentMethod();
    setPayload(next);
    setLoading(false);
  }

  if (loading && !payload) return <SkeletonBlock height="420px" />;

  return (
    <section aria-labelledby="billing-title">
      <div className="page-header">
        <div>
          <h2 className="page-title" id="billing-title">
            {t("billing.title")}
          </h2>
          <p>{t("billing.subtitle")}</p>
        </div>
        {payload?.subscription.plan && payload.subscription.plan !== "SLABAI Free" && (
          <StatusBadge>{payload.subscription.plan}</StatusBadge>
        )}
      </div>
      <div className="content-grid content-grid--two">
        <Card className="activity-card">
          <CreditCard aria-hidden="true" />
          <h2>{t("billing.subscription")}</h2>
          <p className="muted">{t("billing.status")}{payload?.subscription.status ?? "trial"}</p>
        </Card>
        <Card>
          {payload?.paymentMethods.length ? (
            <div className="activity-card">
              <h2>{t("billing.methods")}</h2>
              {payload.paymentMethods.map((method) => (
                <p key={method.id}>
                  {method.brand} {t("billing.ending")} {method.last4}
                </p>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("billing.noMethods")}
              description={t("billing.noMethodsDesc")}
              action={<Button loading={loading} onClick={addPayment} type="button">{t("billing.addMethod")}</Button>}
            />
          )}
        </Card>
      </div>
    </section>
  );
}
