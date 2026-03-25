import Image from "next/image";
import { getPublishedPhotos } from "@/lib/photo-gallery";

export default async function PhotosPage() {
  const { photos, schemaReady } = await getPublishedPhotos();

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
          Photos
        </p>

        <h1 className="max-w-4xl text-5xl font-black uppercase leading-tight">
          Visual Notes from the Same Fault Line
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
          A growing collection of field images, fragments, textures, and visual
          signal from the world behind the writing.
        </p>

        {photos.length ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo) => (
              <article
                key={photo.id}
                className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={photo.public_url}
                    alt={photo.alt_text}
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold uppercase">{photo.title}</h2>
                  {photo.description ? (
                    <p className="mt-3 text-zinc-300">{photo.description}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold uppercase">
              {schemaReady ? "Gallery Coming Online" : "Gallery Setup In Progress"}
            </h2>
            <p className="mt-4 max-w-2xl text-zinc-300">
              {schemaReady
                ? "No published photos are live yet. Upload and publish images from the studio to populate this gallery."
                : "The photo gallery is not initialized yet. Once the latest studio SQL setup is run, published images will appear here automatically."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
