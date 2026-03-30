import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  derivePhotoTitle,
  PHOTO_BUCKET,
  type PhotoAsset,
} from "@/lib/photo-gallery-shared";

const PHOTO_SELECT =
  "id, title, alt_text, description, file_path, status, published_at, created_at, updated_at";
const PHOTO_SELECT_WITH_CURATION = `${PHOTO_SELECT}, featured, featured_order`;

interface PhotoQueryResult {
  photos: PhotoAsset[];
  schemaReady: boolean;
  curationReady: boolean;
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
      featured: photo.featured === true,
      featured_order:
        typeof photo.featured_order === "number" ? photo.featured_order : null,
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
      curationReady: false,
    };
  }

  const supabase = await createClient();
  async function runQuery(selectClause: string, orderByFeatured: boolean) {
    let query = supabase.from("photo_assets").select(selectClause);

    if (!includeDrafts) {
      query = query.eq("status", "published");
    }

    if (orderByFeatured) {
      query = query
        .order("featured", { ascending: false })
        .order("featured_order", { ascending: true, nullsFirst: false });
    }

    return query
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  const curatedResult = await runQuery(PHOTO_SELECT_WITH_CURATION, true);

  if (!curatedResult.error) {
    return {
      photos: normalizePhotos(curatedResult.data as Partial<PhotoAsset>[] | null),
      schemaReady: true,
      curationReady: true,
    };
  }

  if (curatedResult.error.code === "42703") {
    const fallbackResult = await runQuery(PHOTO_SELECT, false);

    if (isSetupError(fallbackResult.error)) {
      return {
        photos: [],
        schemaReady: false,
        curationReady: false,
      };
    }

    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }

    return {
      photos: normalizePhotos(fallbackResult.data as Partial<PhotoAsset>[] | null),
      schemaReady: true,
      curationReady: false,
    };
  }

  if (isSetupError(curatedResult.error)) {
    return {
      photos: [],
      schemaReady: false,
      curationReady: false,
    };
  }

  throw new Error(curatedResult.error.message);
}

export async function getPublishedPhotos() {
  return fetchPhotos(false);
}

export async function getStudioPhotos() {
  return fetchPhotos(true);
}
