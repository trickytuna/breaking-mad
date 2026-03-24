import type { Metadata } from "next";
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
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">
        <header className="border-b border-zinc-800 bg-black/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a
              href="/"
              className="text-lg font-black uppercase tracking-[0.25em] text-cyan-400"
            >
              Breaking Mad
            </a>

            <nav className="flex gap-6 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-300">
              <a href="/about" className="hover:text-cyan-400">
                About
              </a>
              <a href="/work" className="hover:text-cyan-400">
                Work
              </a>
              <a href="/journal" className="hover:text-cyan-400">
                Journal
              </a>
              <a href="/contact" className="hover:text-cyan-400">
                Contact
              </a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="border-t border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-zinc-500">
            © {new Date().getFullYear()} Breaking Mad · Jodick (Joe) Perry Etheridge
          </div>
        </footer>
      </body>
    </html>
  );
}