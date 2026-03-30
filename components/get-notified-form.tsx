"use client";

import { useState } from "react";

type Notice =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

export function GetNotifiedForm({
  emailConfigured,
  smsConfigured,
}: {
  emailConfigured: boolean;
  smsConfigured: boolean;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wantsEmail, setWantsEmail] = useState(true);
  const [wantsSms, setWantsSms] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
          wantsEmail,
          wantsSms,
          consent,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setNotice({
          tone: "error",
          message:
            payload.error ?? "Something went wrong while saving your subscription.",
        });
        return;
      }

      setNotice({
        tone: "success",
        message:
          payload.message ??
          "You are on the list for new Breaking Mad publication alerts.",
      });
      setEmail("");
      setPhone("");
      setConsent(false);
    } catch {
      setNotice({
        tone: "error",
        message: "Something went wrong while saving your subscription.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Email Address
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Mobile Number
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(555) 123-4567"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/50 px-4 py-4">
          <input
            type="checkbox"
            checked={wantsEmail}
            onChange={(event) => setWantsEmail(event.target.checked)}
            className="h-4 w-4 accent-cyan-400"
          />
          <span className="text-sm text-zinc-200">
            Email alerts {emailConfigured ? "available now" : "will activate once email delivery is connected"}
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/50 px-4 py-4">
          <input
            type="checkbox"
            checked={wantsSms}
            onChange={(event) => setWantsSms(event.target.checked)}
            className="h-4 w-4 accent-cyan-400"
          />
          <span className="text-sm text-zinc-200">
            Text alerts {smsConfigured ? "available now" : "will activate once SMS delivery is connected"}
          </span>
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-black/50 px-4 py-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 h-4 w-4 accent-cyan-400"
        />
        <span className="text-sm leading-7 text-zinc-300">
          I want to receive new publication alerts from Breaking Mad by the
          channels I selected. Emails include an unsubscribe link. Text alerts
          can be stopped by replying STOP once SMS delivery is connected.
        </span>
      </label>

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-4 text-sm ${
            notice.tone === "success"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/40 bg-red-400/10 text-red-100"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl border border-cyan-400 bg-cyan-400 px-6 py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Get Notified"}
        </button>
        <p className="max-w-xl text-sm leading-7 text-zinc-500">
          Alerts go out when a new work or journal piece is published, not on every
          small edit.
        </p>
      </div>
    </form>
  );
}
