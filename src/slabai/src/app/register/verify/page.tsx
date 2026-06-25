import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { OtpVerificationForm } from "@/features/auth/OtpVerificationForm";

export default function RegisterVerifyPage() {
  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <div className="auth-card__header">
          <Logo compact />
          <h1>Xác thực đăng ký</h1>
          <p className="muted">Hoàn tất xác thực để chọn môn thể thao chính.</p>
        </div>
        <OtpVerificationForm intent="register" />
      </Card>
    </main>
  );
}
