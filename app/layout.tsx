import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cash Flow Minimizer",
  description: "Settle group debts with the minimum number of transactions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
