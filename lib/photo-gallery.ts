import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  derivePhotoTitle,
  PHOTO_BUCKET,
  type PhotoAsset,
} from "@/lib/photo-gallery-shared";

const PHOTO_SELECT =
  "id, title, alt_text, description, file_path, status, published_at, created_at, updated_at";

interface PhotoQueryResult {
  photos: PhotoAsset[];
  schemaReady: boolean;
}

function isSetupError(error: { code?: string | null } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    error?.code === "42703"
  );
}

function buildPublicPhotoUrl(filePath: string) {
  const env = getSupabaseEnv();

  if (!env.isConfigured || !filePath) {
    return "";
  }

  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${env.url}/storage/v1/object/public/${PHOTO_BUCKET}/${encodedPath}`;
}

function normalizePhotos(data: Partial<PhotoAsset>[] | null): PhotoAsset[] {
  return (data ?? []).map((photo, index) => {
    const filePath = String(photo.file_path ?? "");
    const title =
      String(photo.title ?? "").trim() || derivePhotoTitle(filePath || `photo-${index + 1}`);

    return {
      id: String(photo.id ?? `photo-${index + 1}`),
      title,
      alt_text: String(photo.alt_text ?? "").trim() || title,
      description: String(photo.description ?? ""),
      file_path: filePath,
      public_url: buildPublicPhotoUrl(filePath),
      status: photo.status === "published" ? "published" : "draft",
      published_at: photo.published_at ? String(photo.published_at) : null,
      created_at: String(photo.created_at ?? new Date(0).toISOString()),
      updated_at: String(photo.updated_at ?? new Date(0).toISOString()),
    };
  });
}

async function fetchPhotos(includeDrafts: boolean): Promise<PhotoQueryResult> {
  if (!getSupabaseEnv().isConfigured) {
    return {
      photos: [],
      schemaReady: false,
    };
  }

  const supabase = await createClient();
  let query = supabase
    .from("photo_assets")
    .select(PHOTO_SELECT)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (!includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;

  if (isSetupError(error)) {
    return {
      photos: [],
      schemaReady: false,
    };
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    photos: normalizePhotos(data),
    schemaReady: true,
  };
}

export async function getPublishedPhotos() {
  return fetchPhotos(false);
}

export async function getStudioPhotos() {
  return fetchPhotos(true);
}
