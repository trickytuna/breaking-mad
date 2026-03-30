import { GetNotifiedForm } from "@/components/get-notified-form";
import { getNotificationConfigState } from "@/lib/notifications";

export function GetNotifiedSection() {
  const config = getNotificationConfigState();

  return (
    <section className="border-t border-zinc-900 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_24%),linear-gradient(180deg,rgba(9,9,11,1),rgba(0,0,0,1))]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
                Get Notified
              </p>
              <h2 className="mt-5 text-4xl font-black uppercase leading-tight md:text-5xl">
                Receive a text or email when something new goes live.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                Subscribe once and Breaking Mad will send a short alert when a
                new work or journal piece is published.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Email
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {config.emailConfigured ? "Ready to send" : "Collecting signups"}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Text
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {config.smsConfigured ? "Ready to send" : "Collecting signups"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-800 bg-black/55 p-6">
              <GetNotifiedForm
                emailConfigured={config.emailConfigured}
                smsConfigured={config.smsConfigured}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
