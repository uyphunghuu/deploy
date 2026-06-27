import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";

interface LogoProps {
  compact?: boolean;
}

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link aria-label="SLABAI home" className="logo-link" href={routes.calendar}>
      <Image alt="" height={40} priority src="/brand/SLABAI-Logo.png" width={40} />
      {!compact && <span>SLABAI</span>}
    </Link>
  );
}
