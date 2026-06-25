"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Chrome } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/LinkButton";
import { routes } from "@/lib/routes";
import { emailSchema } from "@/lib/validation";
import { createMockSession, requestCode } from "@/services/mockRepository";

type EmailFormValues = z.infer<typeof emailSchema>;

interface AuthEmailFormProps {
  intent: "register" | "login";
}

export function AuthEmailForm({ intent }: AuthEmailFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" }
  });

  async function onSubmit(values: EmailFormValues) {
    setServerError("");
    try {
      await requestCode(values.email, intent);
      sessionStorage.setItem("slabai-otp-email", values.email);
      sessionStorage.setItem("slabai-remember", String(remember));
      router.push(intent === "register" ? "/register/verify" : "/login/verify");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Không thể gửi mã xác thực.");
    }
  }

  async function onGoogle() {
    setGoogleLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    createMockSession(remember);
    router.push(intent === "register" ? routes.planSport : routes.calendar);
  }

  const isRegister = intent === "register";

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)}>
      <Button loading={googleLoading} onClick={onGoogle} type="button" variant="ghost">
        <Chrome size={18} />
        {isRegister ? "Đăng ký bằng Google" : "Đăng nhập bằng Google"}
      </Button>
      <Field
        autoComplete="email"
        error={errors.email?.message}
        label="Email"
        placeholder="demo@slabai.app"
        type="email"
        {...register("email")}
      />
      {!isRegister && (
        <Checkbox checked={remember} label="Ghi nhớ đăng nhập trên thiết bị này" onChange={(event) => setRemember(event.target.checked)} />
      )}
      {serverError && <div className="alert" role="alert">{serverError}</div>}
      <Button loading={isSubmitting} type="submit" variant="primary">
        {isRegister ? "Gửi mã đăng ký" : "Gửi mã đăng nhập"}
      </Button>
      <div className="inline-actions">
        <span className="muted">{isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}</span>
        <LinkButton href={isRegister ? "/login" : "/register"} size="sm" variant="subtle">
          {isRegister ? "Đăng nhập" : "Đăng ký"}
        </LinkButton>
      </div>
    </form>
  );
}
