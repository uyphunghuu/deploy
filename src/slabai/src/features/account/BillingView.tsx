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

export function BillingView() {
  const [payload, setPayload] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);

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
            Billing & Subscription
          </h2>
          <p>Payment processing là mock only trong frontend phase.</p>
        </div>
        <StatusBadge>{payload?.subscription.plan ?? "SLABAI Free"}</StatusBadge>
      </div>
      <div className="content-grid content-grid--two">
        <Card className="activity-card">
          <CreditCard aria-hidden="true" />
          <h2>Subscription</h2>
          <p className="muted">Status: {payload?.subscription.status ?? "trial"}</p>
        </Card>
        <Card>
          {payload?.paymentMethods.length ? (
            <div className="activity-card">
              <h2>Payment methods</h2>
              {payload.paymentMethods.map((method) => (
                <p key={method.id}>
                  {method.brand} ending {method.last4}
                </p>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có phương thức thanh toán"
              description="Thêm payment method mock để kiểm tra trạng thái UI. Không xử lý thanh toán thật."
              action={<Button loading={loading} onClick={addPayment} type="button">Add payment method</Button>}
            />
          )}
        </Card>
      </div>
    </section>
  );
}
