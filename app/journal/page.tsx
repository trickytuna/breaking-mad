export default function JournalPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
        Journal
      </p>

      <h1 className="text-5xl font-black uppercase leading-tight">
        Musings, Notes, and Dispatches
      </h1>

      <div className="mt-10 grid gap-6">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Entry 01</p>
          <h2 className="mt-2 text-2xl font-bold uppercase">
            What Methane Taught Me About Time
          </h2>
          <p className="mt-3 text-zinc-400">
            Measurement turns invisible things into evidence, but not always into meaning.
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Entry 02</p>
          <h2 className="mt-2 text-2xl font-bold uppercase">
            The Field is Full of Invisible Failures
          </h2>
          <p className="mt-3 text-zinc-400">
            Systems break quietly long before anyone admits they are broken.
          </p>
        </article>
      </div>
    </main>
  );
}