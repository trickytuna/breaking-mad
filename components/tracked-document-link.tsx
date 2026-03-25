"use client";

import { sendAnalyticsEvent } from "@/lib/site-analytics-client";

export function TrackedDocumentLink({
  href,
  label,
  pathname,
  contentSlug,
  children,
}: {
  href: string;
  label: string;
  pathname: string;
  contentSlug: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        void sendAnalyticsEvent(
          {
            eventType: "launch_document_click",
            pathname,
            referrer: window.location.href,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            contentSection: "work",
            contentSlug,
            targetLabel: label,
            targetUrl: href,
          },
          {
            useBeacon: true,
          }
        );
      }}
      className="rounded-2xl border border-zinc-800 bg-black/70 p-5 transition hover:border-cyan-400"
    >
      {children}
    </a>
  );
}
