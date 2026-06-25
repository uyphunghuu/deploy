import { LinkButton } from "@/components/ui/LinkButton";
import { routes } from "@/lib/routes";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="placeholder-page" aria-labelledby="placeholder-title">
      <div className="card card--padded">
        <span className="badge">Placeholder thiết kế</span>
        <h2 className="page-title" id="placeholder-title">
          {title}
        </h2>
        <p className="muted">{description}</p>
        <p className="muted">
          Route này có trong luồng sản phẩm nhưng chưa có PNG reference riêng, nên chỉ dựng shell bảo thủ theo đúng phạm vi MVP.
        </p>
        <LinkButton href={routes.calendar}>Mở Calendar</LinkButton>
      </div>
    </section>
  );
}
