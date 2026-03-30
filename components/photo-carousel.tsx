"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { PhotoAsset } from "@/lib/photo-gallery-shared";

type PhotoCarouselVariant = "home" | "gallery";

function formatPhotoDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getDisplayDescription(photo: PhotoAsset) {
  return (
    photo.description ||
    "Visual notes, field textures, and fragments from the Breaking Mad archive."
  );
}

export function PhotoCarousel({
  photos,
  variant,
}: {
  photos: PhotoAsset[];
  variant: PhotoCarouselVariant;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const titleId = useId();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeTriggered = useRef(false);

  useEffect(() => {
    if (variant !== "home" || photos.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % photos.length);
    }, 6500);

    return () => {
      window.clearInterval(timer);
    };
  }, [photos.length, variant]);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((currentIndex) =>
          currentIndex - 1 < 0 ? photos.length - 1 : currentIndex - 1
        );
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((currentIndex) =>
          currentIndex + 1 >= photos.length ? 0 : currentIndex + 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, photos.length]);

  if (!photos.length) {
    return null;
  }

  const safeIndex = activeIndex % photos.length;
  const activePhoto = photos[safeIndex];
  const publishedLabel = formatPhotoDate(
    activePhoto.published_at ?? activePhoto.created_at
  );
  const isHomeVariant = variant === "home";

  function moveBy(offset: number) {
    setActiveIndex((currentIndex) => {
      const nextIndex = currentIndex + offset;

      if (nextIndex < 0) {
        return photos.length - 1;
      }

      if (nextIndex >= photos.length) {
        return 0;
      }

      return nextIndex;
    });
  }

  function handleTouchStart(event: React.TouchEvent<HTMLButtonElement>) {
    const touch = event.changedTouches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    swipeTriggered.current = false;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLButtonElement>) {
    const touch = event.changedTouches[0];

    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    swipeTriggered.current = true;

    if (deltaX < 0) {
      moveBy(1);
      return;
    }

    moveBy(-1);
  }

  function handleImageActivate() {
    if (swipeTriggered.current) {
      swipeTriggered.current = false;
      return;
    }

    setLightboxOpen(true);
  }

  return (
    <>
      <div
        className={`overflow-hidden rounded-[2rem] border border-zinc-800 ${
          isHomeVariant
            ? "bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),linear-gradient(160deg,rgba(24,24,27,0.98),rgba(9,9,11,1))]"
            : "bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_34%),linear-gradient(160deg,rgba(24,24,27,0.98),rgba(9,9,11,1))]"
        } shadow-[0_32px_120px_rgba(0,0,0,0.45)]`}
        aria-labelledby={titleId}
      >
        <div
          className={`grid ${
            isHomeVariant ? "lg:grid-cols-[1.1fr_0.9fr]" : "xl:grid-cols-[1.2fr_0.8fr]"
          }`}
        >
          <div className="relative min-h-[22rem] sm:min-h-[30rem]">
            <button
              type="button"
              onClick={handleImageActivate}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="absolute inset-0 block h-full w-full cursor-zoom-in text-left [touch-action:pan-y]"
              aria-label={`Open ${activePhoto.title} full screen`}
            >
              <Image
                key={activePhoto.id}
                src={activePhoto.public_url}
                alt={activePhoto.alt_text}
                fill
                sizes={
                  isHomeVariant
                    ? "(min-width: 1024px) 55vw, 100vw"
                    : "(min-width: 1280px) 60vw, 100vw"
                }
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
            </button>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-full border border-white/20 bg-black/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-200">
                  {safeIndex + 1} / {photos.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveBy(-1)}
                    className="rounded-full border border-white/20 bg-black/45 px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
                    aria-label="Previous photo"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBy(1)}
                    className="rounded-full border border-white/20 bg-black/45 px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
                    aria-label="Next photo"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
                {isHomeVariant ? "Photo Signal" : "Featured Carousel"}
              </p>
              <h2
                id={titleId}
                className={`mt-4 font-black uppercase leading-tight ${
                  isHomeVariant ? "text-4xl md:text-5xl" : "text-4xl"
                }`}
              >
                {isHomeVariant ? "Visual Notes in Motion" : "Curated Photo Sequence"}
              </h2>
              <p className="mt-5 text-lg leading-8 text-zinc-300">
                {getDisplayDescription(activePhoto)}
              </p>

              {publishedLabel ? (
                <p className="mt-6 text-xs uppercase tracking-[0.24em] text-zinc-500">
                  {publishedLabel}
                </p>
              ) : null}

              <p className="mt-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                Swipe on touch devices or tap the image for full-screen viewing.
              </p>
            </div>

            <div className="mt-8">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`group relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition ${
                      index === safeIndex
                        ? "border-cyan-400 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                    aria-label={`View ${photo.title}`}
                    aria-pressed={index === safeIndex}
                  >
                    <Image
                      src={photo.public_url}
                      alt={photo.alt_text}
                      fill
                      sizes="96px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 ${
                        index === safeIndex ? "bg-cyan-400/15" : "bg-black/20"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                {isHomeVariant ? (
                  <Link
                    href="/photos"
                    className="rounded-xl border border-cyan-400 bg-cyan-400 px-6 py-3 font-bold text-black transition hover:opacity-90"
                  >
                    Open Photos
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="rounded-xl border border-zinc-700 bg-black/35 px-5 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
                >
                  Open Full Screen
                </button>

                <span className="rounded-xl border border-zinc-700 bg-black/35 px-5 py-3 text-sm text-zinc-400">
                  {isHomeVariant
                    ? "Carousel auto-rotates on the homepage and stays manual inside the full gallery."
                    : "This public page is now fully carousel-led instead of showing a separate archive grid."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${activePhoto.title} full screen`}
          onClick={() => setLightboxOpen(false)}
        >
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">
                  Photo Lightbox
                </p>
                <h3 className="mt-2 text-2xl font-bold uppercase text-white">
                  Breaking Mad Gallery
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1 px-4 pb-4 sm:px-6 sm:pb-6">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveBy(-1);
                }}
                className="absolute left-5 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
                aria-label="Previous photo"
              >
                Prev
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveBy(1);
                }}
                className="absolute right-5 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
                aria-label="Next photo"
              >
                Next
              </button>

              <div
                className="relative h-full w-full"
                onClick={(event) => event.stopPropagation()}
              >
                <Image
                  src={activePhoto.public_url}
                  alt={activePhoto.alt_text}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
