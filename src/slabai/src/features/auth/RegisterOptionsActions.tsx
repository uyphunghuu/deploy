"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { signInWithGoogle } from "@/services/mockRepository";

export function RegisterOptionsActions() {
  const [loading, setLoading] = useState(false);

  async function registerWithGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setLoading(false);
    }
  }

  function preventPlaceholderNavigation(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
  }

  return (
    <div className="form-stack register-actions">
      <Button className="google-register-button" loading={loading} onClick={registerWithGoogle} type="button" variant="ghost">
        <span aria-hidden="true" className="google-register-mark">
          G
        </span>
        Đăng ký bằng Google
      </Button>
      <LinkButton className="email-register-button" href="/register/email" size="lg" variant="gradient">
        Đăng ký bằng email
      </LinkButton>
      <p className="legal-copy">
        Khi tiếp tục, bạn đồng ý với{" "}
        <Link href="#" onClick={preventPlaceholderNavigation}>
          Điều khoản dịch vụ
        </Link>{" "}
        và{" "}
        <Link href="#" onClick={preventPlaceholderNavigation}>
          Chính sách quyền riêng tư
        </Link>{" "}
        của chúng tôi.
      </p>
    </div>
  );
}
