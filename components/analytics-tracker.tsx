"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendAnalyticsEvent } from "@/lib/site-analytics-client";

const EXCLUDED_PATH_PREFIXES = ["/studio", "/login", "/auth"];
const LAST_TRACKED_KEY = "bm_last_tracked_page";
const LAST_TRACKED_AT_KEY = "bm_last_tracked_at";
const PREVIOUS_PATH_KEY = "bm_previous_path";

function shouldTrackPath(pathname: string) {
  return !EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getCurrentSearch(searchParams: ReturnType<typeof useSearchParams>) {
  const value = searchParams.toString();
  return value ? `?${value}` : "";
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = getCurrentSearch(searchParams);

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) {
      return;
    }

    const pageKey = `${pathname}${search}`;
    const now = Date.now();
    let referrer = document.referrer;

    try {
      const lastTrackedPage = sessionStorage.getItem(LAST_TRACKED_KEY);
      const lastTrackedAt = Number(sessionStorage.getItem(LAST_TRACKED_AT_KEY) ?? "0");

      if (lastTrackedPage === pageKey && now - lastTrackedAt < 4000) {
        return;
      }

      const previousPath = sessionStorage.getItem(PREVIOUS_PATH_KEY);
      referrer = previousPath
        ? `${window.location.origin}${previousPath}`
        : document.referrer;

      sessionStorage.setItem(LAST_TRACKED_KEY, pageKey);
      sessionStorage.setItem(LAST_TRACKED_AT_KEY, String(now));
      sessionStorage.setItem(PREVIOUS_PATH_KEY, pageKey);
    } catch {}

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    void sendAnalyticsEvent({
      eventType: "page_view",
      pathname,
      search,
      referrer,
      timezone,
    });
  }, [pathname, search]);

  return null;
}
