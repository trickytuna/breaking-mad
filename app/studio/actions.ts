"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPostNotifications } from "@/lib/notifications";
import { getStudioAccessState, requireStudioAccess } from "@/lib/studio-auth";
import {
  parseDocumentsJson,
  slugify,
  type ContentSection,
  type ContentStatus,
} from "@/lib/site-content";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseSection(value: string): ContentSection {
  return value === "work" ? "work" : "journal";
}

function parseStatus(value: string): ContentStatus {
  return value === "draft" ? "draft" : "published";
}

function revalidateContentPaths(
  section: ContentSection,
  slug: string,
  previousSection?: string,
  previousSlug?: string
) {
  revalidatePath("/");
  revalidatePath("/journal");
  revalidatePath("/work");
  revalidatePath("/studio");
  revalidatePath(`/${section}/${slug}`);

  if (previousSection && previousSlug) {
    revalidatePath(`/${previousSection}/${previousSlug}`);
  }
}

function redirectToStudio(status: string) {
  redirect(`/studio?status=${status}`);
}

export async function savePostAction(formData: FormData) {
  const access = await requireStudioAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login");
    }

    redirect(access.reason === "setup" ? "/studio?status=config" : "/studio?status=denied");
  }

  const title = readString(formData, "title");
  const excerpt = readString(formData, "excerpt");
  const body = readString(formData, "body");
  const section = parseSection(readString(formData, "section"));
  const status = parseStatus(readString(formData, "status"));
  const id = readString(formData, "id");
  const previousSlug = readString(formData, "previousSlug");
  const previousSection = readString(formData, "previousSection");
  const previousStatus = readString(formData, "previousStatus");
  const currentPublishedAt = readString(formData, "currentPublishedAt");
  const requestedSlug = readString(formData, "slug");
  const documentsJson = readString(formData, "documentsJson");
  const slug = slugify(requestedSlug || title);
  const documents = parseDocumentsJson(documentsJson);
  const isFirstPublish = status === "published" && previousStatus !== "published";

  if (!title || !excerpt || !body || !slug) {
    redirectToStudio("invalid");
  }

  if (documents === null) {
    redirectToStudio("documents");
  }

  const now = new Date().toISOString();
  const payload = {
    title,
    slug,
    excerpt,
    body,
    section,
    status,
    updated_at: now,
    published_at: status === "published" ? currentPublishedAt || now : null,
    documents,
  };

  const response = id
    ? await access.supabase
        .from("site_posts")
        .update(payload)
        .eq("id", id)
        .select("id, title, slug, excerpt, section")
        .single()
    : await access.supabase.from("site_posts").insert({
        ...payload,
        created_at: now,
      })
        .select("id, title, slug, excerpt, section")
        .single();

  if (response.error?.code === "42P01" || response.error?.code === "PGRST205") {
    redirectToStudio("setup");
  }

  if (response.error?.code === "23505") {
    redirectToStudio("duplicate");
  }

  if (response.error) {
    redirectToStudio("error");
  }

  revalidateContentPaths(section, slug, previousSection, previousSlug);

  if (isFirstPublish && response.data) {
    const notificationResult = await sendPostNotifications(access.supabase, {
      id: String(response.data.id),
      title,
      slug,
      excerpt,
      section,
    });

    if (notificationResult.status === "issue") {
      redirectToStudio("published_issue");
    }

    if (notificationResult.status === "pending") {
      redirectToStudio("published_pending");
    }

    redirectToStudio("published_notified");
  }

  redirectToStudio(id ? "updated" : "created");
}

export async function deletePostAction(formData: FormData) {
  const access = await requireStudioAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login");
    }

    redirect(access.reason === "setup" ? "/studio?status=config" : "/studio?status=denied");
  }

  const id = readString(formData, "id");
  const slug = readString(formData, "previousSlug");
  const section = parseSection(readString(formData, "previousSection"));

  if (!id) {
    redirectToStudio("invalid");
  }

  const { error } = await access.supabase.from("site_posts").delete().eq("id", id);

  if (error?.code === "42P01" || error?.code === "PGRST205") {
    redirectToStudio("setup");
  }

  if (error) {
    redirectToStudio("error");
  }

  if (slug) {
    revalidateContentPaths(section, slug, section, slug);
  } else {
    revalidatePath("/journal");
    revalidatePath("/work");
    revalidatePath("/studio");
  }

  redirectToStudio("deleted");
}

export async function signOutAction() {
  const access = await getStudioAccessState();

  if (access.supabase) {
    await access.supabase.auth.signOut();
  }

  redirect("/login");
}
