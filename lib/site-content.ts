import { createClient } from "@/lib/supabase/server";
import {
  normalizeDocumentList,
  type ContentSection,
  type SitePost,
} from "@/lib/site-content-shared";

export type {
  ContentSection,
  ContentStatus,
  PostDocument,
  SitePost,
} from "@/lib/site-content-shared";
export {
  formatPostDate,
  parseDocumentsJson,
  slugify,
} from "@/lib/site-content-shared";

interface PostQueryResult {
  posts: SitePost[];
  schemaReady: boolean;
}

const POST_SELECT =
  "id, title, slug, excerpt, body, section, status, published_at, created_at, updated_at, documents";

const FALLBACK_CONTENT: Record<ContentSection, SitePost[]> = {
  journal: [
    {
      id: "fallback-journal-1",
      section: "journal",
      status: "published",
      title: "What Methane Taught Me About Time",
      slug: "what-methane-taught-me-about-time",
      excerpt:
        "Measurement turns invisible things into evidence, but not always into meaning.",
      body: [
        "# What Methane Taught Me About Time",
        "Measurement turns invisible things into evidence, but not always into meaning.",
        "In the field, timing changes everything. A leak, a reading, a gust of wind, and a decision can collapse years of planning into a single moment of clarity or confusion.",
        "That tension between precision and interpretation is where many of these essays begin.",
      ].join("\n\n"),
      published_at: "2026-03-01T12:00:00.000Z",
      created_at: "2026-03-01T12:00:00.000Z",
      updated_at: "2026-03-01T12:00:00.000Z",
      documents: [],
    },
    {
      id: "fallback-journal-2",
      section: "journal",
      status: "published",
      title: "The Field is Full of Invisible Failures",
      slug: "the-field-is-full-of-invisible-failures",
      excerpt:
        "Systems break quietly long before anyone admits they are broken.",
      body: [
        "# The Field is Full of Invisible Failures",
        "Systems break quietly long before anyone admits they are broken.",
        "Most failures begin as drift: a missed calibration, a tired habit, a small shortcut that nobody thinks will matter.",
        "By the time the problem becomes visible, the real story has usually been unfolding for a long time.",
      ].join("\n\n"),
      published_at: "2026-03-05T12:00:00.000Z",
      created_at: "2026-03-05T12:00:00.000Z",
      updated_at: "2026-03-05T12:00:00.000Z",
      documents: [],
    },
  ],
  work: [
    {
      id: "fallback-work-1",
      section: "work",
      status: "published",
      title: "Time Gambit",
      slug: "time-gambit",
      excerpt:
        "Long-form work exploring systems, memory, time, and consequence.",
      body: [
        "# Time Gambit",
        "Time Gambit is a long-form project about consequence, pattern recognition, and the stories people tell themselves while systems are changing underneath them.",
        "It sits at the edge of memoir, speculation, and systems thinking.",
        "## Launch Notes",
        "- Core concept deck",
        "- Sample chapters",
        "- Positioning narrative",
      ].join("\n\n"),
      published_at: "2026-02-18T12:00:00.000Z",
      created_at: "2026-02-18T12:00:00.000Z",
      updated_at: "2026-02-18T12:00:00.000Z",
      documents: [],
    },
    {
      id: "fallback-work-2",
      section: "work",
      status: "published",
      title: "Field Notes from the Invisible",
      slug: "field-notes-from-the-invisible",
      excerpt:
        "Essays on energy, measurement, emissions, human behavior, and the carbon age.",
      body: [
        "# Field Notes from the Invisible",
        "Field Notes from the Invisible gathers essays about emissions, observation, measurement, and the unseen systems shaping everyday life.",
        "It connects technical work in the field with the larger emotional and cultural story surrounding energy and consequence.",
      ].join("\n\n"),
      published_at: "2026-02-25T12:00:00.000Z",
      created_at: "2026-02-25T12:00:00.000Z",
      updated_at: "2026-02-25T12:00:00.000Z",
      documents: [],
    },
    {
      id: "fallback-work-3",
      section: "work",
      status: "published",
      title: "Breaking Mad",
      slug: "breaking-mad-project",
      excerpt:
        "Musings, stories, music, conversations, and signal from the beautiful wreckage.",
      body: [
        "# Breaking Mad",
        "Breaking Mad is the umbrella project for essays, recordings, media, and conversations that sit between personal history and public systems.",
        "It is the place where the writing, music, and long-form work all begin to speak to each other.",
      ].join("\n\n"),
      published_at: "2026-03-10T12:00:00.000Z",
      created_at: "2026-03-10T12:00:00.000Z",
      updated_at: "2026-03-10T12:00:00.000Z",
      documents: [],
    },
  ],
};

function isSetupError(error: { code?: string | null } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    error?.code === "42703"
  );
}

function normalizePosts(data: Partial<SitePost>[] | null): SitePost[] {
  return (data ?? []).map((post, index) => ({
    id: String(post.id ?? `fallback-post-${index + 1}`),
    title: String(post.title ?? ""),
    slug: String(post.slug ?? ""),
    excerpt: String(post.excerpt ?? ""),
    body: String(post.body ?? ""),
    section: post.section === "work" ? "work" : "journal",
    status: post.status === "draft" ? "draft" : "published",
    published_at: post.published_at ? String(post.published_at) : null,
    created_at: String(post.created_at ?? new Date(0).toISOString()),
    updated_at: String(post.updated_at ?? new Date(0).toISOString()),
    documents: normalizeDocumentList(post.documents),
  }));
}

async function fetchPublishedPosts(
  section: ContentSection
): Promise<PostQueryResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_posts")
    .select(POST_SELECT)
    .eq("section", section)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (isSetupError(error)) {
    return {
      posts: FALLBACK_CONTENT[section],
      schemaReady: false,
    };
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    posts: normalizePosts(data),
    schemaReady: true,
  };
}

export async function getPublishedPostsBySection(section: ContentSection) {
  return fetchPublishedPosts(section);
}

export async function getPublishedPostBySlug(
  section: ContentSection,
  slug: string
) {
  const result = await fetchPublishedPosts(section);
  return {
    post: result.posts.find((post) => post.slug === slug) ?? null,
    schemaReady: result.schemaReady,
  };
}

export async function getStudioPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_posts")
    .select(POST_SELECT)
    .order("updated_at", { ascending: false });

  if (isSetupError(error)) {
    return {
      posts: [] as SitePost[],
      schemaReady: false,
    };
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    posts: normalizePosts(data),
    schemaReady: true,
  };
}
