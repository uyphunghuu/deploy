import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { AuthEmailForm } from "@/features/auth/AuthEmailForm";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Card className="auth-card">
        <div className="auth-card__header">
          <Logo compact />
          <h1>Đăng nhập</h1>
          <p className="muted">Dùng email hoặc Google mock để vào không gian SLABAI.</p>
        </div>
        <AuthEmailForm intent="login" />
      </Card>
    </main>
  );
}
