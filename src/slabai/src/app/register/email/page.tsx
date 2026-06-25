import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { AuthEmailForm } from "@/features/auth/AuthEmailForm";

export default function RegisterEmailPage() {
  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <div className="auth-card__header">
          <Logo compact />
          <h1>Đăng ký bằng email</h1>
          <p className="muted">Nhận mã xác thực để tạo tài khoản SLABAI demo.</p>
        </div>
        <AuthEmailForm intent="register" />
        <p className="legal-copy">Không có email thật nào được gửi trong prototype này.</p>
      </Card>
    </main>
  );
}
