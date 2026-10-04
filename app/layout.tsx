import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const heading = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Omar Mehawed — IT Developer",
    template: "%s — Omar Mehawed",
  },
  description:
    "IT student and developer in Alexandria. Full-stack systems, Linux, and the projects behind them.",
  openGraph: {
    title: "Omar Mehawed — IT Developer",
    description:
      "IT student and developer in Alexandria. Full-stack systems, Linux, and the projects behind them.",
    type: "website",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${heading.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
