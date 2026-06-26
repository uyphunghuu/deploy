import type { Metadata } from "next";
import { LanguageProvider } from "@/lib/LanguageContext";
import "./globals.css";
import "./register-fixes.css";
import "./calendar-fixes.css";
import "./responsive-fixes.css";

export const metadata: Metadata = {
  title: "SLABAI",
  description: "Nền tảng huấn luyện thể thao hỗ trợ bởi AI."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <LanguageProvider>
          <div className="app-root">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
