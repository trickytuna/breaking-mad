export const PHOTO_BUCKET = "site-photos";

export type PhotoStatus = "draft" | "published";

export interface PhotoAsset {
  id: string;
  title: string;
  alt_text: string;
  description: string;
  file_path: string;
  public_url: string;
  status: PhotoStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function derivePhotoTitle(input: string) {
  const withoutExtension = input.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "Untitled Photo";
  }

  return normalized.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}
