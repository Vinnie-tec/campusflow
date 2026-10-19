import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus FLow",
  description: "Code Built by Vinnie",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
