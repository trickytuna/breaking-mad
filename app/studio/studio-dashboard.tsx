"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { StudioPostEditor } from "@/app/studio/studio-post-editor";
import {
  formatPostDate,
  type ContentSection,
  type SitePost,
} from "@/lib/site-content-shared";

type StatusFilter = "all" | "draft" | "published";
type SectionFilter = "all" | ContentSection;

type EditorState =
  | {
      mode: "new";
      section: ContentSection;
    }
  | {
      mode: "edit";
      postId: string;
    };

function buildLiveHref(post: SitePost) {
  return `/${post.section}/${post.slug}`;
}

export function StudioDashboard({
  posts,
}: {
  posts: SitePost[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all");
  const [search, setSearch] = useState("");
  const [editorState, setEditorState] = useState<EditorState>({
    mode: "new",
    section: "work",
  });
  const deferredSearch = useDeferredValue(search);

  const filteredPosts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return posts.filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) {
        return false;
      }

      if (sectionFilter !== "all" && post.section !== sectionFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query)
      );
    });
  }, [deferredSearch, posts, sectionFilter, statusFilter]);

  const selectedPost =
    editorState.mode === "edit"
      ? posts.find((post) => post.id === editorState.postId) ?? null
      : null;

  const stats = {
    drafts: posts.filter((post) => post.status === "draft").length,
    work: posts.filter(
      (post) => post.section === "work" && post.status === "published"
    ).length,
    journal: posts.filter(
      (post) => post.section === "journal" && post.status === "published"
    ).length,
    documents: posts.reduce((count, post) => count + post.documents.length, 0),
  };

  const activeEditorLabel =
    editorState.mode === "edit"
      ? selectedPost?.section === "work"
        ? "Edit Work"
        : "Edit Journal Entry"
      : editorState.section === "work"
        ? "New Work"
        : "New Journal Entry";

  return (
    <div className="mt-10 grid gap-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Drafts</p>
          <p className="mt-3 text-4xl font-black uppercase">{stats.drafts}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Live Works
          </p>
          <p className="mt-3 text-4xl font-black uppercase">{stats.work}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Live Journal
          </p>
          <p className="mt-3 text-4xl font-black uppercase">{stats.journal}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Launch Materials
          </p>
          <p className="mt-3 text-4xl font-black uppercase">{stats.documents}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
              Quick Start
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase">
              Manage Everything Here
            </h2>
            <p className="mt-3 max-w-3xl text-zinc-400">
              Create a new work launch, draft a journal entry, or pick something
              from the library to edit. Once published, your updates appear on the
              public site automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setEditorState({ mode: "new", section: "work" })}
              className="rounded-lg bg-cyan-400 px-4 py-3 font-bold text-black"
            >
              New Work
            </button>
            <button
              type="button"
              onClick={() => setEditorState({ mode: "new", section: "journal" })}
              className="rounded-lg border border-zinc-700 px-4 py-3 font-bold text-white"
            >
              New Journal Entry
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
                  Content Library
                </p>
                <h2 className="mt-3 text-2xl font-black uppercase">
                  Browse and Reopen Posts
                </h2>
              </div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                {filteredPosts.length} visible
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, excerpt, or slug"
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                    Status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                  >
                    <option value="all">All statuses</option>
                    <option value="draft">Drafts</option>
                    <option value="published">Published</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                    Type
                  </span>
                  <select
                    value={sectionFilter}
                    onChange={(event) =>
                      setSectionFilter(event.target.value as SectionFilter)
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                  >
                    <option value="all">All content</option>
                    <option value="work">Work</option>
                    <option value="journal">Journal</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {filteredPosts.length ? (
                filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className={`rounded-2xl border p-5 transition ${
                      editorState.mode === "edit" && editorState.postId === post.id
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-zinc-800 bg-black/60 hover:border-cyan-400"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
                          {post.section} / {post.status}
                        </p>
                        <h3 className="mt-2 text-xl font-bold uppercase">
                          {post.title}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-400">{post.excerpt}</p>
                      </div>
                      <div className="text-right text-xs uppercase tracking-[0.18em] text-zinc-500">
                        <p>{formatPostDate(post.published_at)}</p>
                        {post.section === "work" ? (
                          <p className="mt-2">{post.documents.length} materials</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setEditorState({ mode: "edit", postId: post.id })
                        }
                        className="rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-black"
                      >
                        Edit
                      </button>

                      {post.status === "published" ? (
                        <Link
                          href={buildLiveHref(post)}
                          className="rounded-lg border border-zinc-700 px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white"
                        >
                          Open Live
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-black/60 p-5 text-zinc-400">
                  No posts match the current filters.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <StudioPostEditor
            key={
              editorState.mode === "edit"
                ? `edit-${editorState.postId}`
                : `new-${editorState.section}`
            }
            heading={activeEditorLabel}
            initialSection={
              editorState.mode === "new" ? editorState.section : undefined
            }
            post={selectedPost ?? undefined}
          />
        </div>
      </section>
    </div>
  );
}
