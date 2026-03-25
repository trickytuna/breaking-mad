"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import {
  derivePhotoTitle,
  PHOTO_BUCKET,
  type PhotoAsset,
  type PhotoStatus,
} from "@/lib/photo-gallery-shared";
import { slugify } from "@/lib/site-content-shared";
import { createClient } from "@/lib/supabase/client";

type Notice =
  | {
      tone: "success" | "warning" | "error";
      message: string;
    }
  | null;

function parsePhotoStatus(value: FormDataEntryValue | null): PhotoStatus {
  return value === "published" ? "published" : "draft";
}

function getFileExtension(file: File) {
  const fileNameExtension = file.name.split(".").pop()?.trim().toLowerCase();

  if (fileNameExtension) {
    return fileNameExtension;
  }

  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    default:
      return "jpg";
  }
}

function buildStoragePath(file: File) {
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
  const extension = getFileExtension(file);
  const year = new Date().getFullYear();

  return `studio/${year}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Something went wrong while updating the photo library.";
}

function isSetupError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("bucket") ||
    message.includes("photo_assets") ||
    message.includes("permission") ||
    message.includes("policy") ||
    message.includes("not found")
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) {
    return null;
  }

  const toneClasses =
    notice.tone === "success"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
      : notice.tone === "warning"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
        : "border-red-400/40 bg-red-400/10 text-red-100";

  return <div className={`rounded-2xl border p-4 text-sm ${toneClasses}`}>{notice.message}</div>;
}

export function StudioPhotoManager({
  photos,
  schemaReady,
}: {
  photos: PhotoAsset[];
  schemaReady: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [notice, setNotice] = useState<Notice>(null);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refreshStudio() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const form = event.currentTarget;

    if (!schemaReady) {
      setNotice({
        tone: "warning",
        message:
          "The photo library still needs the latest SQL setup in Supabase before uploads can work.",
      });
      return;
    }

    const formData = new FormData(form);
    const status = parsePhotoStatus(formData.get("photoStatus"));
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!files.length) {
      setNotice({
        tone: "error",
        message: "Choose at least one image file before uploading.",
      });
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));

    if (invalidFile) {
      setNotice({
        tone: "error",
        message: "Only image files can be uploaded to the photo library.",
      });
      return;
    }

    setUploading(true);

    try {
      let uploadedCount = 0;

      for (const file of files) {
        const storagePath = buildStoragePath(file);
        const now = new Date().toISOString();
        const title = derivePhotoTitle(file.name);

        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(storagePath, file, {
            cacheControl: "3600",
            contentType: file.type || undefined,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { error: insertError } = await supabase.from("photo_assets").insert({
          title,
          alt_text: title,
          description: "",
          file_path: storagePath,
          status,
          created_at: now,
          updated_at: now,
          published_at: status === "published" ? now : null,
        });

        if (insertError) {
          await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
          throw insertError;
        }

        uploadedCount += 1;
      }

      form.reset();
      setNotice({
        tone: "success",
        message: `Uploaded ${uploadedCount} photo${uploadedCount === 1 ? "" : "s"} to the studio library.`,
      });
      refreshStudio();
    } catch (error) {
      setNotice({
        tone: isSetupError(error) ? "warning" : "error",
        message: isSetupError(error)
          ? "The photo library still needs the latest SQL setup in Supabase before uploads can work."
          : getErrorMessage(error),
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
    photo: PhotoAsset
  ) {
    event.preventDefault();
    setNotice(null);
    setSavingId(photo.id);

    try {
      const formData = new FormData(event.currentTarget);
      const title = String(formData.get("title") ?? "").trim();
      const altText = String(formData.get("altText") ?? "").trim();
      const description = String(formData.get("description") ?? "").trim();
      const status = parsePhotoStatus(formData.get("status"));

      if (!title) {
        setNotice({
          tone: "error",
          message: "Each photo needs a title before it can be saved.",
        });
        return;
      }

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("photo_assets")
        .update({
          title,
          alt_text: altText || title,
          description,
          status,
          updated_at: now,
          published_at:
            status === "published" ? photo.published_at ?? now : null,
        })
        .eq("id", photo.id);

      if (error) {
        throw error;
      }

      setNotice({
        tone: "success",
        message: `Saved updates to "${title}".`,
      });
      refreshStudio();
    } catch (error) {
      setNotice({
        tone: isSetupError(error) ? "warning" : "error",
        message: isSetupError(error)
          ? "The photo library still needs the latest SQL setup in Supabase before updates can work."
          : getErrorMessage(error),
      });
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(photo: PhotoAsset) {
    const confirmed = window.confirm(`Delete "${photo.title}" from the photo library?`);

    if (!confirmed) {
      return;
    }

    setNotice(null);
    setDeletingId(photo.id);

    try {
      const { error: deleteRowError } = await supabase
        .from("photo_assets")
        .delete()
        .eq("id", photo.id);

      if (deleteRowError) {
        throw deleteRowError;
      }

      const { error: deleteFileError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .remove([photo.file_path]);

      setNotice({
        tone: deleteFileError ? "warning" : "success",
        message: deleteFileError
          ? `"${photo.title}" was removed from the gallery, but the source file could not be deleted from storage automatically.`
          : `"${photo.title}" was deleted from the photo library.`,
      });
      refreshStudio();
    } catch (error) {
      setNotice({
        tone: isSetupError(error) ? "warning" : "error",
        message: isSetupError(error)
          ? "The photo library still needs the latest SQL setup in Supabase before deletes can work."
          : getErrorMessage(error),
      });
    } finally {
      setDeletingId(null);
    }
  }

  const publishedPhotos = photos.filter((photo) => photo.status === "published").length;

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            Photos Library
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase">
            Upload and Manage Your Collection
          </h2>
          <p className="mt-3 max-w-3xl text-zinc-400">
            Add images directly from the studio, keep them private as drafts while
            you organize them, then publish them to the live gallery when they are ready.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-black/60 px-4 py-3 text-sm text-zinc-400">
          {publishedPhotos} live / {photos.length} total
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/photos"
          className="rounded-lg border border-cyan-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.15em] text-cyan-400 transition hover:bg-cyan-400/10"
        >
          Open Live Gallery
        </Link>
      </div>

      <div className="mt-6">
        <NoticeBanner notice={notice} />
      </div>

      {!schemaReady ? (
        <div className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-amber-100">
          <h3 className="text-xl font-bold uppercase">Photo Setup Still Needed</h3>
          <p className="mt-3 max-w-3xl text-sm">
            Rerun the latest SQL setup script in Supabase and refresh this page.
            That one script adds the photo library table and storage bucket policies.
          </p>
        </div>
      ) : (
        <>
          <form
            onSubmit={handleUpload}
            className="mt-6 rounded-2xl border border-zinc-800 bg-black/60 p-5"
          >
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Upload Images
                </span>
                <input
                  type="file"
                  name="files"
                  accept="image/*"
                  multiple
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white file:mr-4 file:rounded-md file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:font-bold file:text-black"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Publish State
                </span>
                <select
                  name="photoStatus"
                  defaultValue="draft"
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                >
                  <option value="draft">Draft - keep private for now</option>
                  <option value="published">Published - show in /photos</option>
                </select>
              </label>
            </div>

            <p className="mt-3 text-sm text-zinc-500">
              Upload straight from your browser. Titles are generated from the
              filename automatically, and you can refine the details below after upload.
            </p>

            <div className="mt-5">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-lg bg-cyan-400 px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Photos"}
              </button>
            </div>
          </form>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {photos.length ? (
              photos.map((photo) => (
                <article
                  key={photo.id}
                  className="rounded-2xl border border-zinc-800 bg-black/60 p-5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                    <Image
                      src={photo.public_url}
                      alt={photo.alt_text}
                      fill
                      sizes="(min-width: 1280px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>

                  <form
                    onSubmit={(event) => handleSave(event, photo)}
                    className="mt-5 space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                          Title
                        </span>
                        <input
                          type="text"
                          name="title"
                          defaultValue={photo.title}
                          className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                          Alt Text
                        </span>
                        <input
                          type="text"
                          name="altText"
                          defaultValue={photo.alt_text}
                          className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Description
                      </span>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={photo.description}
                        className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                          Visibility
                        </span>
                        <select
                          name="status"
                          defaultValue={photo.status}
                          className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </label>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                        Stored as <span className="text-zinc-200">{photo.file_path}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={savingId === photo.id}
                        className="rounded-lg bg-cyan-400 px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === photo.id ? "Saving..." : "Save Details"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(photo)}
                        disabled={deletingId === photo.id}
                        className="rounded-lg border border-red-500 px-4 py-3 font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === photo.id ? "Deleting..." : "Delete Photo"}
                      </button>
                    </div>
                  </form>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-zinc-400 xl:col-span-2">
                No photos uploaded yet. Add a few images above and they will appear
                here immediately for sorting, drafting, and publishing.
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
