"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { OtpInput } from "@/components/ui/OtpInput";
import { copy } from "@/lib/copy";
import { routes } from "@/lib/routes";
import { verifyCode } from "@/services/mockRepository";

interface OtpVerificationFormProps {
  intent: "register" | "login";
}

export function OtpVerificationForm({ intent }: OtpVerificationFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const email = typeof window !== "undefined" ? sessionStorage.getItem("slabai-otp-email") ?? copy.demoEmail : copy.demoEmail;

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  async function submit() {
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Nhập đủ 6 chữ số.");
      return;
    }
    setLoading(true);
    try {
      await verifyCode(code, sessionStorage.getItem("slabai-remember") !== "false");
      router.push(intent === "register" ? routes.planSport : routes.calendar);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Mã xác thực chưa đúng.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 360));
    setSeconds(60);
    setResending(false);
  }

  return (
    <div className="form-stack">
      <LinkButton href={intent === "register" ? "/register/email" : "/login"} size="sm" variant="ghost">
        <ArrowLeft size={16} />
        Quay lại
      </LinkButton>
      <p className="muted">Nhập mã 6 chữ số đã gửi tới {email}. Mã demo là {copy.otp}.</p>
      <OtpInput error={error} onChange={setCode} value={code} />
      <Button loading={loading} onClick={submit} type="button">
        Xác thực
      </Button>
      <Button disabled={seconds > 0 || resending} loading={resending} onClick={resend} type="button" variant="ghost">
        {seconds > 0 ? `Gửi lại sau ${seconds}s` : "Gửi lại mã"}
      </Button>
    </div>
  );
}
