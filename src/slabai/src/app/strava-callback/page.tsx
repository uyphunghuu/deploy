"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/services/apiClient";
import { Card } from "@/components/ui/Card";
import { SkeletonBlock } from "@/components/ui/Skeleton";

function StravaCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMsg("Không tìm thấy mã code từ Strava.");
      return;
    }

    apiRequest<{ message: string }>(`/integrations/strava/callback?code=${code}`, {
      method: "POST"
    })
      .then(() => {
        setStatus("success");
        // Redirect back to devices & apps page after 1.5s
        setTimeout(() => {
          router.push("/settings/devices-apps");
        }, 1500);
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Lỗi khi kết nối Strava");
      });
  }, [code, router]);

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Card className="p-8 text-center" style={{ maxWidth: "400px", width: "100%" }}>
        {status === "loading" && (
          <div>
            <h2 className="mb-4 text-xl font-bold">Đang kết nối Strava...</h2>
            <SkeletonBlock height="20px" width="80%" className="mx-auto" />
          </div>
        )}
        {status === "success" && (
          <div>
            <h2 className="mb-2 text-xl font-bold text-[var(--success-color)]">Kết nối thành công!</h2>
            <p className="text-[var(--text-muted)]">Đang chuyển hướng về trang cài đặt...</p>
          </div>
        )}
        {status === "error" && (
          <div>
            <h2 className="mb-2 text-xl font-bold text-[var(--danger-color)]">Kết nối thất bại</h2>
            <p className="mb-4 text-[var(--text-muted)]">{errorMsg}</p>
            <button 
              className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md"
              onClick={() => router.push("/settings/devices-apps")}
            >
              Quay lại
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function StravaCallbackPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <StravaCallbackContent />
    </Suspense>
  );
}
