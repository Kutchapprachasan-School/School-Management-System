import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "School OS - ระบบบริหารจัดการโรงเรียนอัจฉริยะ",
  description: "ระบบปฏิบัติการโรงเรียนอัจฉริยะ ยุคใหม่ ใช้งานง่าย ข้อมูลเชื่อมโยงกันอย่างสมบูรณ์แบบ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full scroll-smooth">
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans">
        <I18nProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
