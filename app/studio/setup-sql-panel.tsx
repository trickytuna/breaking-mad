"use client";

import { useState } from "react";

export function SetupSqlPanel({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
          Setup Script
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-amber-300/30 bg-black/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-100 transition hover:border-amber-200 hover:bg-black/40"
        >
          {copied ? "Copied" : "Copy Script"}
        </button>
      </div>
      <p className="mb-3 text-xs text-amber-100/80">
        The first line should begin with <span className="font-mono">create extension</span>.
      </p>
      <textarea
        readOnly
        value={sql}
        rows={18}
        className="w-full rounded-2xl border border-amber-300/20 bg-black/40 px-4 py-4 font-mono text-xs text-amber-50"
      />
    </div>
  );
}
