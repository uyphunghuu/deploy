"use client";

import { Chrome } from "lucide-react";
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

  return (
    <div className="form-stack">
      <Button loading={loading} onClick={registerWithGoogle} type="button" variant="ghost">
        <Chrome size={18} />
        Đăng ký bằng Google
      </Button>
      <LinkButton href="/register/email" size="lg" variant="gradient">
        Đăng ký bằng email
      </LinkButton>
      <p className="legal-copy">
        Khi tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của SLABAI.
      </p>
    </div>
  );
}
