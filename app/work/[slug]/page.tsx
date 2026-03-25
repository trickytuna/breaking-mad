import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import {
  formatPostDate,
  getPublishedPostBySlug,
} from "@/lib/site-content";

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { post } = await getPublishedPostBySlug("work", slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-white">
      <Link
        href="/work"
        className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400"
      >
        Back to Work
      </Link>

      <p className="mt-8 text-sm uppercase tracking-[0.2em] text-zinc-500">
        {formatPostDate(post.published_at)}
      </p>
      <h1 className="mt-3 text-5xl font-black uppercase leading-tight">
        {post.title}
      </h1>
      <p className="mt-6 text-xl leading-8 text-zinc-300">{post.excerpt}</p>

      <div className="mt-10">
        <MarkdownContent content={post.body} />
      </div>

      {post.documents.length ? (
        <section className="mt-14 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            Launch Documents
          </p>
          <h2 className="mt-4 text-3xl font-black uppercase">
            Open Supporting Materials
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {post.documents.map((document) => (
              <a
                key={`${document.title}-${document.url}`}
                href={document.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-zinc-800 bg-black/70 p-5 transition hover:border-cyan-400"
              >
                <p className="text-xl font-bold uppercase text-white">
                  {document.title}
                </p>
                {document.description ? (
                  <p className="mt-3 text-zinc-400">{document.description}</p>
                ) : null}
                <p className="mt-5 text-sm font-bold uppercase tracking-[0.15em] text-cyan-400">
                  {document.cta_label}
                </p>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
