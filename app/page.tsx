import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0">
          <Image
            src="/images/banner.png"
            alt="Breaking Mad banner scene"
            fill
            priority
            className="object-cover opacity-50"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

        <div className="relative mx-auto grid min-h-[78vh] max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6">
              <Image
                src="/images/logo.png"
                alt="Breaking Mad logo"
                width={110}
                height={110}
                className="h-auto w-auto"
                priority
              />
            </div>

            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-400">
              Breaking Mad
            </p>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-tight md:text-7xl">
              Writing from the fault line between precision and chaos.
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-300 md:text-xl">
              Musings, essays, memory, music, field notes, and long-form work
              from Jodick (Joe) Perry Etheridge — a Texas writer, environmental
              scientist, inventor, and observer of systems.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/about"
                className="rounded-xl border border-cyan-400 bg-cyan-400 px-6 py-3 font-bold text-black transition hover:opacity-90"
              >
                About Joe
              </a>

              <a
                href="/work"
                className="rounded-xl border border-zinc-700 bg-black/40 px-6 py-3 font-bold text-white transition hover:border-cyan-400"
              >
                View Work
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/images/joe-headshot.jpg"
                  alt="Jodick Joe Perry Etheridge"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-400">
                  Writer · Scientist · Inventor
                </p>
                <p className="mt-3 text-zinc-300">
                  Signal from the carbon age. Stories, systems, and songs from a
                  life spent measuring what most people never see.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold uppercase">Journal</h2>
            <p className="mt-3 text-zinc-400">
              Musings, chats, experiences, and thoughts in motion.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold uppercase">Work</h2>
            <p className="mt-3 text-zinc-400">
              Essays, projects, book development, and selected writing.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold uppercase">Media</h2>
            <p className="mt-3 text-zinc-400">
              Breaking Mad on YouTube, music, conversations, and recorded pieces.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}