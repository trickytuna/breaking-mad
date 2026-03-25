"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_SITE_VISIT_STATE,
  type SiteVisitState,
} from "@/lib/site-engagement-shared";

const visitCountFormatter = new Intl.NumberFormat("en-US");

export function SiteVisitCounter() {
  const [state, setState] = useState<SiteVisitState>(EMPTY_SITE_VISIT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadCount() {
      try {
        const response = await fetch("/api/site-visits", {
          method: "POST",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const data = (await response.json()) as SiteVisitState;

        if (!ignore) {
          setState(data);
          setLoaded(true);
        }
      } catch {
        if (!ignore) {
          setLoaded(true);
        }
      }
    }

    void loadCount();

    return () => {
      ignore = true;
    };
  }, []);

  if (!loaded || !state.enabled) {
    return null;
  }

  return (
    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
      Site Visits {visitCountFormatter.format(state.count)}
    </p>
  );
}
