import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tribal Heritage Vote — Adivasi Artists Nomination & Voting Platform",
    template: "%s | Tribal Heritage Vote",
  },
  description:
    "Celebrating and preserving India's rich Adivasi cultural heritage through digital nomination, video showcase, and democratic voting. Based in Rourkela, Odisha.",
  keywords: [
    "Adivasi",
    "Tribal Artists",
    "Nomination",
    "Voting",
    "Cultural Heritage",
    "Rourkela",
    "Odisha",
    "India",
    "Folk Art",
    "Indigenous Art",
  ],
  authors: [{ name: "Tribal Heritage Vote" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Tribal Heritage Vote",
    title: "Tribal Heritage Vote — Adivasi Artists Nomination & Voting Platform",
    description:
      "Celebrating and preserving India's rich Adivasi cultural heritage through digital nomination, video showcase, and democratic voting.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
