import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { OtpVerificationForm } from "@/features/auth/OtpVerificationForm";

export default function LoginVerifyPage() {
  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <div className="auth-card__header">
          <Logo compact />
          <h1>Xác thực đăng nhập</h1>
          <p className="muted">Sau khi xác thực, bạn sẽ vào Dashboard placeholder.</p>
        </div>
        <OtpVerificationForm intent="login" />
      </Card>
    </main>
  );
}
