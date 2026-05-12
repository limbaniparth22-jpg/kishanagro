import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "AgroERP – Agro Retail Management",
  description: "Complete mini-ERP for agro retail shops – stock, billing, purchases, ledger & reports",
  keywords: "agro shop management, fertilizer shop software, agro billing software",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}