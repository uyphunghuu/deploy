import Image from "next/image";
import Link from "next/link";
import { Activity, Bot, Clock3, Flame, Gauge, HeartPulse, Trophy, Users } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RegisterOptionsActions } from "@/features/auth/RegisterOptionsActions";
import { AuthFooter } from "@/components/layout/AuthFooter";
import { copy } from "@/lib/copy";

export default function RegisterPage() {
  return (
    <div className="auth-page-with-footer">
      <main className="marketing-page">
        <div className="marketing-grid">
        <MarketingHeader />
        <section className="marketing-hero" aria-labelledby="register-heading">
          <div className="hero-intro">
            <div className="hero-copy" id="ai-coach">
              <StatusBadge>AI Coach cá nhân hóa</StatusBadge>
              <h1 id="register-heading">
                AI giúp bạn
                <br />
                tập luyện <span className="brand-gradient-text">tốt hơn</span>
                <br />
                <span className="brand-gradient-text">mỗi ngày.</span>
              </h1>
              <p>{copy.marketingBody}</p>
              <div className="inline-actions" aria-label="Nguồn dữ liệu hỗ trợ">
                <strong>Garmin</strong>
                <strong>Strava</strong>
                <strong>Apple Health</strong>
              </div>
            </div>
            <div className="hero-visual" aria-label="Vận động viên đang xem đồng hồ tập luyện">
              <Image
                alt=""
                className="hero-athlete-image"
                fill
                priority
                sizes="(min-width: 1280px) 30vw, 100vw"
                src="/brand/register-hero-athlete.png"
              />
            </div>
            <Card className="metric-float" aria-label="Chỉ số tập luyện minh họa">
              <div className="robot-avatar" aria-hidden="true">
                <Bot size={42} />
              </div>
              <div className="metric-list">
                <div className="metric-row">
                  <HeartPulse size={20} />
                  <span>VO₂ Max</span>
                  <strong>54</strong>
                  <StatusBadge>Tốt</StatusBadge>
                </div>
                <div className="metric-row">
                  <Gauge size={20} />
                  <span>Nhịp tim trung bình</span>
                  <strong>142</strong>
                  <StatusBadge tone="success">Ổn định</StatusBadge>
                </div>
                <div className="metric-row">
                  <Flame size={20} />
                  <span>Lượng calo đốt cháy</span>
                  <strong>586</strong>
                  <StatusBadge tone="orange">Cao</StatusBadge>
                </div>
                <div className="metric-row">
                  <Clock3 size={20} />
                  <span>Thời gian phục hồi</span>
                  <strong>18 giờ</strong>
                  <StatusBadge>Tốt</StatusBadge>
                </div>
              </div>
            </Card>
          </div>
          <Card className="registration-card" aria-label="Đăng ký SLABAI">
            <Logo compact />
            <div>
              <h2>SLABAI</h2>
              <p className="muted">Đăng ký để bắt đầu hành trình huấn luyện cùng AI và cộng đồng.</p>
            </div>
            <p className="member-link">
              Đã là thành viên? <Link href="/login">Đăng nhập</Link>
            </p>
            <RegisterOptionsActions />
          </Card>
          <div className="community-visual" id="community">
            <Image
              alt=""
              className="community-image"
              fill
              sizes="(min-width: 1280px) 46vw, 100vw"
              src="/brand/register-community-runners.png"
            />
            <StatusBadge tone="orange">Cộng đồng & thử thách</StatusBadge>
            <h2>{copy.communityHeadline}</h2>
            <p>Kết nối, thi đua và chinh phục cùng những người mới mỗi ngày.</p>
          </div>
        </section>
        <Card className="social-proof" id="about">
          <div>
            <Users aria-hidden="true" />
            <strong>50.000+</strong>
            <span className="muted">Người dùng</span>
          </div>
          <div>
            <Trophy aria-hidden="true" />
            <strong>120+</strong>
            <span className="muted">Giải chạy bộ</span>
          </div>
          <div>
            <Activity aria-hidden="true" />
            <strong>2.5M+</strong>
            <span className="muted">Hoạt động được ghi nhận</span>
          </div>
          <div className="sr-only">
            <Gauge />
            <Flame />
          </div>
        </Card>
      </div>
      </main>
      <AuthFooter />
    </div>
  );
}
