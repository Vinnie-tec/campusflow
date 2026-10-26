import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusFlow",
  description:
    "A learning and project workspace for students and instructors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      data-new-gr-c-s-check-loaded="14.1338.0"
      data-gr-ext-installed=""
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
