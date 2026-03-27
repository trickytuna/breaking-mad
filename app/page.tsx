import Image from "next/image";
import Link from "next/link";
import { YouTubeShowcase } from "@/components/youtube-showcase";
import { formatPostDate, getPublishedPostsBySection } from "@/lib/site-content";
import { getYouTubeChannelFeed } from "@/lib/youtube";

export default async function Home() {
  const [{ posts: journalPosts }, { posts: workPosts }, youtubeChannel] =
    await Promise.all([
    getPublishedPostsBySection("journal"),
    getPublishedPostsBySection("work"),
    getYouTubeChannelFeed(),
  ]);

  const latestJournalPosts = journalPosts.slice(0, 2);
  const latestWorkPosts = workPosts.slice(0, 2);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0">
          <Image
            src="/images/banner.png"
            alt="Breaking Mad banner scene"
            fill
            priority
            className="object-cover opacity-50"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

        <div className="relative mx-auto grid min-h-[78vh] max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6">
              <Image
                src="/images/logo.png"
                alt="Breaking Mad logo"
                width={255}
                height={255}
                className="h-auto w-48 md:w-60"
                priority
              />
            </div>

            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-400">
              Breaking Mad
            </p>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-tight md:text-7xl">
              Writing from the fault line between precision and chaos.
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-300 md:text-xl">
              Musings, essays, memory, music, field notes, and long-form work
              from Jodick (Joe) Perry Etheridge, a Texas writer, environmental
              scientist, inventor, and observer of systems.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="rounded-xl border border-cyan-400 bg-cyan-400 px-6 py-3 font-bold text-black transition hover:opacity-90"
              >
                About Joe
              </Link>

              <Link
                href="/work"
                className="rounded-xl border border-zinc-700 bg-black/40 px-6 py-3 font-bold text-white transition hover:border-cyan-400"
              >
                View Work
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/images/joe-headshot.jpg"
                  alt="Jodick Joe Perry Etheridge"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                  Writer / Scientist / Inventor
                </p>
                <p className="mt-3 text-zinc-500">
                  Signal from the carbon age. Stories, systems, and songs from a
                  life spent measuring what most people never see.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/journal"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-cyan-400"
          >
            <h2 className="text-xl font-bold uppercase">Journal</h2>
            <p className="mt-3 text-zinc-600">
              Musings, chats, experiences, and thoughts in motion.
            </p>
          </Link>

          <Link
            href="/work"
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition hover:border-cyan-400"
          >
            <h2 className="text-xl font-bold uppercase">Work</h2>
            <p className="mt-3 text-zinc-600">
              Essays, projects, book development, and selected writing.
            </p>
          </Link>

          <Link
            href={youtubeChannel.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-red-500/35 bg-[linear-gradient(160deg,rgba(24,24,27,0.96),rgba(9,9,11,1))] p-6 transition hover:border-red-500"
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-400">
              YouTube
            </p>
            <h2 className="mt-3 text-xl font-bold uppercase">Media</h2>
            <p className="mt-3 text-zinc-500">
              Breaking Mad on YouTube, music, conversations, and recorded
              pieces.
            </p>
          </Link>
        </div>
      </section>

      <YouTubeShowcase channel={youtubeChannel} />

      <section className="border-t border-zinc-900 bg-zinc-950/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
                Latest Signal
              </p>
              <h2 className="mt-4 text-4xl font-black uppercase">
                Fresh Writing from the Studio
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <section>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-2xl font-bold uppercase">Latest Journal</h3>
                <Link
                  href="/journal"
                  className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-400"
                >
                  View All
                </Link>
              </div>

              <div className="grid gap-4">
                {latestJournalPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-zinc-800 bg-black/70 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {formatPostDate(post.published_at)}
                    </p>
                    <h4 className="mt-3 text-2xl font-bold uppercase">
                      <Link
                        href={`/journal/${post.slug}`}
                        className="transition hover:text-cyan-400"
                      >
                        {post.title}
                      </Link>
                    </h4>
                    <p className="mt-3 text-zinc-600">{post.excerpt}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-2xl font-bold uppercase">Recent Work</h3>
                <Link
                  href="/work"
                  className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-400"
                >
                  View All
                </Link>
              </div>

              <div className="grid gap-4">
                {latestWorkPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-zinc-800 bg-black/70 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {formatPostDate(post.published_at)}
                    </p>
                    <h4 className="mt-3 text-2xl font-bold uppercase">
                      <Link
                        href={`/work/${post.slug}`}
                        className="transition hover:text-cyan-400"
                      >
                        {post.title}
                      </Link>
                    </h4>
                    <p className="mt-3 text-zinc-600">{post.excerpt}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
