import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus FLow",
  description: "Code Built by Vinnie",
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
