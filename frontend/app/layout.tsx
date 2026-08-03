import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agentic Content Creator",
  description: "Review and approve AI-generated event posts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
