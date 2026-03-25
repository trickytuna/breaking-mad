export type ContentSection = "journal" | "work";
export type ContentStatus = "draft" | "published";

export interface PostDocument {
  title: string;
  url: string;
  description: string;
  cta_label: string;
}

export interface SitePost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  section: ContentSection;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  documents: PostDocument[];
}

function normalizeDocument(
  raw: unknown,
  index: number
): PostDocument | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const document = raw as Record<string, unknown>;
  const title = String(document.title ?? "").trim();
  const url = String(document.url ?? "").trim();
  const description = String(document.description ?? "").trim();
  const ctaLabel = String(
    document.cta_label ?? document.ctaLabel ?? "Open Document"
  ).trim();

  if (!title && !url && !description) {
    return null;
  }

  return {
    title: title || `Document ${index + 1}`,
    url,
    description,
    cta_label: ctaLabel || "Open Document",
  };
}

export function normalizeDocumentList(raw: unknown): PostDocument[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry, index) => normalizeDocument(entry, index))
    .filter((document): document is PostDocument => document !== null);
}

export function parseDocumentsJson(input: string) {
  if (!input.trim()) {
    return [] as PostDocument[];
  }

  try {
    const parsed = JSON.parse(input) as unknown;
    return normalizeDocumentList(parsed);
  } catch {
    return null;
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function formatPostDate(value: string | null) {
  if (!value) {
    return "Draft";
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
