import Link from "next/link";
import { formatPostDate, getPublishedPostsBySection } from "@/lib/site-content";

export default async function JournalPage() {
  const { posts } = await getPublishedPostsBySection("journal");

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
        Journal
      </p>

      <h1 className="text-5xl font-black uppercase leading-tight">
        Musings, Notes, and Dispatches
      </h1>

      <div className="mt-10 grid gap-6">
        {posts.length ? (
          posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                {formatPostDate(post.published_at)}
              </p>
              <h2 className="mt-2 text-2xl font-bold uppercase">
                <Link href={`/journal/${post.slug}`} className="hover:text-cyan-400">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-zinc-600">{post.excerpt}</p>
              <Link
                href={`/journal/${post.slug}`}
                className="mt-5 inline-block text-sm font-bold uppercase tracking-[0.15em] text-cyan-400"
              >
                Read Entry
              </Link>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-600">
            No published journal entries yet.
          </div>
        )}
      </div>
    </main>
  );
}
