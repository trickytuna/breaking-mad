export default function WorkPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
        Work
      </p>

      <h1 className="text-5xl font-black uppercase leading-tight">
        Selected Projects and Writing
      </h1>

      <div className="mt-10 grid gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold uppercase">Time Gambit</h2>
          <p className="mt-3 text-zinc-400">
            Long-form work exploring systems, memory, time, and consequence.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold uppercase">Field Notes from the Invisible</h2>
          <p className="mt-3 text-zinc-400">
            Essays on energy, measurement, emissions, human behavior, and the carbon age.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-2xl font-bold uppercase">Breaking Mad</h2>
          <p className="mt-3 text-zinc-400">
            Musings, stories, music, conversations, and signal from the beautiful wreckage.
          </p>
        </div>
      </div>
    </main>
  );
}