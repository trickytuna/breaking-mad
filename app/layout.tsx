import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { SiteVisitCounter } from "@/components/site-visit-counter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Breaking Mad",
  description:
    "Musings, essays, music, field notes, and long-form work from Jodick (Joe) Perry Etheridge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <AnalyticsTracker />
        <header className="border-b border-zinc-800 bg-black/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-xl font-black uppercase tracking-[0.25em] text-cyan-400 md:text-2xl"
            >
              Breaking Mad
            </Link>

            <nav className="flex flex-wrap items-center justify-end gap-4 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-300 md:gap-6">
              <Link href="/about" className="hover:text-cyan-400">
                About
              </Link>
              <Link href="/work" className="hover:text-cyan-400">
                Work
              </Link>
              <Link href="/journal" className="hover:text-cyan-400">
                Journal
              </Link>
              <Link href="/photos" className="hover:text-cyan-400">
                Photos
              </Link>
              <Link href="/contact" className="hover:text-cyan-400">
                Contact
              </Link>
              <Link
                href="/studio"
                className="rounded-full border border-cyan-400/50 px-3 py-1 text-cyan-400 transition hover:border-cyan-400 hover:bg-cyan-400/10"
              >
                Studio
              </Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="border-t border-zinc-800">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-zinc-500">
            <div>Copyright {year} Breaking Mad - Jodick (Joe) Perry Etheridge</div>
            <SiteVisitCounter />
          </div>
        </footer>
      </body>
    </html>
  );
}
