import { createClient } from "@/lib/supabase/server";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token ?? "";
  let status: "success" | "invalid" | "error" = "invalid";

  if (token) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("unsubscribe_site_subscriber", {
        target_token: token,
      });

      if (!error && data === true) {
        status = "success";
      } else if (!error) {
        status = "invalid";
      } else {
        status = "error";
      }
    } catch {
      status = "error";
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-20 text-white">
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
        Notifications
      </p>

      <h1 className="text-5xl font-black uppercase">
        {status === "success"
          ? "You Have Been Unsubscribed"
          : status === "error"
            ? "Unsubscribe Could Not Finish"
            : "Unsubscribe Link Not Recognized"}
      </h1>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-lg leading-8 text-zinc-300">
          {status === "success"
            ? "You will not receive future Breaking Mad publication alerts from this link."
            : status === "error"
              ? "Something went wrong while processing the unsubscribe request. Try the link again in a moment."
              : "This unsubscribe link is missing or no longer valid."}
        </p>
      </div>
    </main>
  );
}
