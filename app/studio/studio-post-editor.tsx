"use client";

import { useDeferredValue, useState } from "react";
import { deletePostAction, savePostAction } from "@/app/studio/actions";
import { MarkdownContent } from "@/components/markdown-content";
import {
  formatPostDate,
  slugify,
  type ContentSection,
  type PostDocument,
  type SitePost,
} from "@/lib/site-content-shared";

function createEmptyDocument(): PostDocument {
  return {
    title: "",
    url: "",
    description: "",
    cta_label: "Open Document",
  };
}

function hasDocumentContent(document: PostDocument) {
  return Boolean(
    document.title.trim() ||
      document.url.trim() ||
      document.description.trim() ||
      document.cta_label.trim()
  );
}

function getTemplateBody(section: ContentSection) {
  if (section === "work") {
    return [
      "# Project Title",
      "Write a clear opening paragraph that explains what this work is and why it matters.",
      "## What This Work Includes",
      "- Manuscript",
      "- Proposal deck",
      "- Supporting essays",
      "## Launch Notes",
      "Add anything collaborators, editors, or readers should know before opening the materials.",
    ].join("\n\n");
  }

  return [
    "# Journal Entry Title",
    "Open with the main thought, memory, or observation you want the reader to carry.",
    "## Thread",
    "Expand the scene, tension, or idea here.",
    "## Closing Note",
    "Land on the image, question, or realization you want to leave behind.",
  ].join("\n\n");
}

function getWorkflowText(section: ContentSection) {
  if (section === "work") {
    return [
      "1. Give the project a strong title and excerpt.",
      "2. Write the main page in markdown.",
      "3. Add launch documents like PDFs, decks, or storefront links.",
      "4. Save as draft until you are ready, then publish it live.",
    ];
  }

  return [
    "1. Start with the title and excerpt.",
    "2. Draft the piece in markdown.",
    "3. Preview the finished layout beside the editor.",
    "4. Publish when you want it to appear on the site.",
  ];
}

export function StudioPostEditor({
  post,
  heading,
  initialSection = "journal",
}: {
  post?: SitePost;
  heading: string;
  initialSection?: ContentSection;
}) {
  const isExisting = !!post;
  const startingSection = post?.section ?? initialSection;
  const [section, setSection] = useState<ContentSection>(startingSection);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(post?.slug));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? getTemplateBody(startingSection));
  const [documents, setDocuments] = useState<PostDocument[]>(post?.documents ?? []);
  const deferredBody = useDeferredValue(body);

  const documentsJson = JSON.stringify(
    section === "work" ? documents.filter(hasDocumentContent) : []
  );
  const workflow = getWorkflowText(section);

  function updateDocument(
    index: number,
    field: keyof PostDocument,
    value: string
  ) {
    setDocuments((current) =>
      current.map((document, documentIndex) =>
        documentIndex === index
          ? {
              ...document,
              [field]: value,
            }
          : document
      )
    );
  }

  function addDocument() {
    setDocuments((current) => [...current, createEmptyDocument()]);
  }

  function removeDocument(index: number) {
    setDocuments((current) =>
      current.filter((_, documentIndex) => documentIndex !== index)
    );
  }

  function switchSection(nextSection: ContentSection) {
    setSection(nextSection);

    if (!isExisting && !body.trim()) {
      setBody(getTemplateBody(nextSection));
    }
  }

  return (
    <form
      action={savePostAction}
      className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
    >
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <input type="hidden" name="previousSlug" value={post?.slug ?? ""} />
      <input type="hidden" name="previousSection" value={post?.section ?? ""} />
      <input
        type="hidden"
        name="currentPublishedAt"
        value={post?.published_at ?? ""}
      />
      <input type="hidden" name="documentsJson" value={documentsJson} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase">{heading}</h2>
          {isExisting ? (
            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-zinc-500">
              {post.section} / {post.status} / {formatPostDate(post.published_at)}
            </p>
          ) : (
            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-zinc-500">
              Draft inside the website, preview it live, then publish when ready.
            </p>
          )}
        </div>

        <label className="block min-w-52">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Publish State
          </span>
          <select
            name="status"
            defaultValue={post?.status ?? "draft"}
            className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
          >
            <option value="draft">Draft - keep private</option>
            <option value="published">Published - show on the site</option>
          </select>
        </label>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Workflow
            </p>
            <h3 className="mt-3 text-xl font-bold uppercase">
              {section === "work" ? "Launch a Work" : "Publish a Journal Entry"}
            </h3>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => switchSection("work")}
              className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.15em] ${
                section === "work"
                  ? "bg-cyan-400 text-black"
                  : "border border-zinc-700 text-zinc-300"
              }`}
            >
              Work
            </button>
            <button
              type="button"
              onClick={() => switchSection("journal")}
              className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.15em] ${
                section === "journal"
                  ? "bg-cyan-400 text-black"
                  : "border border-zinc-700 text-zinc-300"
              }`}
            >
              Journal
            </button>
          </div>
        </div>

        <input type="hidden" name="section" value={section} />

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {workflow.map((step) => (
            <div
              key={step}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300"
            >
              {step}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Title
          </span>
          <input
            type="text"
            name="title"
            required
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);

              if (!slugEdited) {
                setSlug(slugify(nextTitle));
              }
            }}
            placeholder={
              section === "work"
                ? "Ex: Time Gambit"
                : "Ex: What Methane Taught Me About Time"
            }
            className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Excerpt
          </span>
          <textarea
            name="excerpt"
            required
            rows={3}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="A short summary that appears on listings and the homepage."
            className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
          />
        </label>
      </div>

      <details className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
        <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.15em] text-zinc-300">
          Advanced Settings
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Slug
            </span>
            <input
              type="text"
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value);
              }}
              className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
            />
          </label>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
            The slug controls the page URL. It is generated automatically from the
            title, but you can edit it here if needed.
          </div>
        </div>
      </details>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Main Content
          </span>
          <textarea
            name="body"
            required
            rows={20}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-[28rem] w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 font-mono text-sm text-white"
          />
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
            Markdown works here: headings, lists, links, quotes, emphasis, and tables.
          </p>
        </label>

        <div className="rounded-2xl border border-zinc-800 bg-black/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">
            Live Preview
          </p>
          <div className="mt-5">
            {deferredBody.trim() ? (
              <MarkdownContent content={deferredBody} />
            ) : (
              <p className="text-zinc-500">
                Start writing to preview the finished page.
              </p>
            )}
          </div>
        </div>
      </div>

      {section === "work" ? (
        <section className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold uppercase">Launch Materials</h3>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Add documents or links you want people to open from the work page,
                like manuscripts, decks, PDF downloads, storefront pages, or press kits.
              </p>
            </div>

            <button
              type="button"
              onClick={addDocument}
              className="rounded-lg border border-cyan-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-cyan-400"
            >
              Add Material
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {documents.length ? (
              documents.map((document, index) => (
                <div
                  key={`${heading}-document-${index}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Material Title
                      </span>
                      <input
                        type="text"
                        required
                        value={document.title}
                        onChange={(event) =>
                          updateDocument(index, "title", event.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Link or File URL
                      </span>
                      <input
                        type="url"
                        required
                        value={document.url}
                        onChange={(event) =>
                          updateDocument(index, "url", event.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Short Description
                      </span>
                      <input
                        type="text"
                        value={document.description}
                        onChange={(event) =>
                          updateDocument(index, "description", event.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                      />
                    </label>

                    <label className="block md:min-w-44">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Button Label
                      </span>
                      <input
                        type="text"
                        value={document.cta_label}
                        onChange={(event) =>
                          updateDocument(index, "cta_label", event.target.value)
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="rounded-lg border border-red-500 px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-5 text-sm text-zinc-500">
                No launch materials yet. Add one so visitors can open the documents
                or links connected to this work.
              </div>
            )}
          </div>

          {documents.length ? (
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Launch Card Preview
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {documents.filter(hasDocumentContent).map((document, index) => (
                  <a
                    key={`preview-document-${index}`}
                    href={document.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-zinc-800 bg-black/70 p-4 transition hover:border-cyan-400"
                  >
                    <p className="text-lg font-bold uppercase text-white">
                      {document.title || `Material ${index + 1}`}
                    </p>
                    {document.description ? (
                      <p className="mt-2 text-sm text-zinc-400">
                        {document.description}
                      </p>
                    ) : null}
                    <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-cyan-400">
                      {document.cta_label || "Open Document"}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-cyan-400 px-4 py-3 font-bold text-black"
        >
          {isExisting ? "Save Changes" : "Create Post"}
        </button>

        {isExisting ? (
          <button
            type="submit"
            formAction={deletePostAction}
            className="rounded-lg border border-red-500 px-4 py-3 font-bold text-red-200"
          >
            Delete Post
          </button>
        ) : null}
      </div>
    </form>
  );
}
