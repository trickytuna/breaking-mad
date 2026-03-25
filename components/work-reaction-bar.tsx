"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_WORK_REACTION_SUMMARY,
  type WorkReaction,
  type WorkReactionSummary,
} from "@/lib/site-engagement-shared";

const reactionCountFormatter = new Intl.NumberFormat("en-US");

function ReactionButton({
  active,
  disabled,
  label,
  count,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-[0.14em] transition ${
        active
          ? "border-cyan-500 bg-cyan-950 text-cyan-100"
          : "border-zinc-300 bg-white text-zinc-700 hover:border-cyan-400 hover:text-cyan-700"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      {label} {reactionCountFormatter.format(count)}
    </button>
  );
}

export function WorkReactionBar({ postId }: { postId: string }) {
  const [summary, setSummary] = useState<WorkReactionSummary>(
    EMPTY_WORK_REACTION_SUMMARY
  );
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSummary() {
      try {
        const response = await fetch(
          `/api/work-reactions?postId=${encodeURIComponent(postId)}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = (await response.json()) as WorkReactionSummary;

        if (!ignore) {
          setSummary(data);
          setLoaded(true);
        }
      } catch {
        if (!ignore) {
          setLoaded(true);
          setError("Reactions are unavailable right now.");
        }
      }
    }

    void loadSummary();

    return () => {
      ignore = true;
    };
  }, [postId]);

  async function submitReaction(reaction: WorkReaction) {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/work-reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          reaction,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = (await response.json()) as WorkReactionSummary;
      setSummary(data);
    } catch {
      setError("Your vote did not save. Please try again.");
    } finally {
      setIsSaving(false);
      setLoaded(true);
    }
  }

  if (!loaded || !summary.enabled) {
    return null;
  }

  return (
    <section className="mt-14 border-t border-zinc-200 pt-8">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-500">
        Reader Signal
      </p>
      <h2 className="mt-3 text-2xl font-black uppercase text-zinc-950">
        Did This Work Land?
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-zinc-600">
        Leave a quick signal for this piece. Each browser can keep one reaction
        per work page and switch between like or dislike at any time.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <ReactionButton
          active={summary.currentReaction === "like"}
          disabled={isSaving}
          label="Like"
          count={summary.likeCount}
          onClick={() => void submitReaction("like")}
        />
        <ReactionButton
          active={summary.currentReaction === "dislike"}
          disabled={isSaving}
          label="Dislike"
          count={summary.dislikeCount}
          onClick={() => void submitReaction("dislike")}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
