import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import {
  formatPostDate,
  getPublishedPostBySlug,
} from "@/lib/site-content";

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { post } = await getPublishedPostBySlug("journal", slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-white">
      <Link
        href="/journal"
        className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400"
      >
        Back to Journal
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
    </main>
  );
}
