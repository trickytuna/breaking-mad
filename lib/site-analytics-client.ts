"use client";

import { type AnalyticsClientEvent } from "@/lib/site-analytics-shared";

const ANALYTICS_ENDPOINT = "/api/analytics";

export async function sendAnalyticsEvent(
  event: AnalyticsClientEvent,
  options?: {
    useBeacon?: boolean;
  }
) {
  const payload = JSON.stringify(event);

  if (options?.useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const body = new Blob([payload], {
      type: "application/json",
    });

    return navigator.sendBeacon(ANALYTICS_ENDPOINT, body);
  }

  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: options?.useBeacon ?? false,
      credentials: "same-origin",
    });
  } catch {}

  return true;
}
