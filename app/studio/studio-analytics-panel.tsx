"use client";

import Link from "next/link";
import { type StudioAnalytics } from "@/lib/site-analytics-shared";

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-3 text-4xl font-black uppercase">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">{note}</p>
    </div>
  );
}

function AnalyticsList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: Array<{
    label: string;
    value: number;
    secondaryValue?: number;
    href?: string;
  }>;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
      <h3 className="text-xl font-bold uppercase">{title}</h3>
      <div className="mt-5 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={`${title}-${item.label}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="min-w-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="truncate text-sm font-bold uppercase tracking-[0.15em] text-cyan-400"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-bold uppercase tracking-[0.15em] text-white">
                    {item.label}
                  </p>
                )}
                {typeof item.secondaryValue === "number" ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-zinc-500">
                    {item.secondaryValue} unique visitors
                  </p>
                ) : null}
              </div>
              <p className="text-2xl font-black uppercase text-white">
                {item.value.toLocaleString("en-US")}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

export function StudioAnalyticsPanel({
  analytics,
}: {
  analytics: StudioAnalytics;
}) {
  if (!analytics.enabled) {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
          Analytics
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase">
          Visitor Intelligence Needs One More Setup Pass
        </h2>
        <p className="mt-4 max-w-3xl text-zinc-400">
          Rerun the latest Supabase SQL setup and refresh this page. Once the new
          analytics table exists, Studio will start showing traffic, countries,
          referrers, devices, campaigns, and work-performance signals here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
        Analytics
      </p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase">Studio Traffic and Signal</h2>
          <p className="mt-3 max-w-3xl text-zinc-400">
            This is a 30-day view of page traffic, visitor mix, document clicks,
            and work performance. It stores coarse metadata only, not raw IPs.
          </p>
        </div>
        <p className="rounded-2xl border border-zinc-800 bg-black/60 px-4 py-3 text-sm uppercase tracking-[0.15em] text-zinc-400">
          Rolling 30 days
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Page Views"
          value={analytics.overview.totalPageViews.toLocaleString("en-US")}
          note="Across public pages"
        />
        <StatCard
          label="Visitors"
          value={analytics.overview.uniqueVisitors.toLocaleString("en-US")}
          note="Unique browsers"
        />
        <StatCard
          label="Sessions"
          value={analytics.overview.sessions.toLocaleString("en-US")}
          note="Thirty-minute windows"
        />
        <StatCard
          label="Launch Clicks"
          value={analytics.overview.documentClicks.toLocaleString("en-US")}
          note="Work document opens"
        />
        <StatCard
          label="Views Last 7 Days"
          value={analytics.overview.pageViewsLast7Days.toLocaleString("en-US")}
          note={`${analytics.overview.countriesTracked} countries tracked`}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <AnalyticsList
          title="Top Pages"
          items={analytics.topPages}
          emptyMessage="Page traffic will show up here after a few visits."
        />
        <AnalyticsList
          title="Top Referrers"
          items={analytics.topReferrers}
          emptyMessage="No external referrers have been captured yet."
        />
        <AnalyticsList
          title="Top Countries"
          items={analytics.topCountries}
          emptyMessage="Country-level traffic data will appear here."
        />
        <AnalyticsList
          title="Device Mix"
          items={analytics.topDevices}
          emptyMessage="Device data will appear after public traffic comes in."
        />
        <AnalyticsList
          title="Browsers"
          items={analytics.topBrowsers}
          emptyMessage="Browser data will appear here."
        />
        <AnalyticsList
          title="Campaigns"
          items={analytics.topCampaigns}
          emptyMessage="UTM-tagged campaign traffic has not been detected yet."
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
          <h3 className="text-xl font-bold uppercase">Top Works</h3>
          <div className="mt-5 grid gap-3">
            {analytics.topWorks.length ? (
              analytics.topWorks.map((work) => (
                <div
                  key={work.slug}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/work/${work.slug}`}
                        className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-400"
                      >
                        {work.title}
                      </Link>
                      <p className="mt-2 text-sm text-zinc-500">/work/{work.slug}</p>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.15em] text-zinc-500">
                      <p>{work.views} views</p>
                      <p className="mt-1">{work.documentClicks} launch clicks</p>
                      <p className="mt-1">
                        {work.likes} like / {work.dislikes} dislike
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
                Work-level traffic and reaction summaries will show up here as visitors engage.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/60 p-5">
          <h3 className="text-xl font-bold uppercase">Recent Traffic</h3>
          <div className="mt-5 grid gap-3">
            {analytics.recentTraffic.length ? (
              analytics.recentTraffic.map((event, index) => (
                <div
                  key={`${event.pathname}-${event.viewedAt}-${index}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-sm font-bold uppercase tracking-[0.15em] text-white">
                    {event.pathname}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.15em] text-zinc-500">
                    {new Date(event.viewedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-3 text-sm text-zinc-400">
                    {event.country} / {event.device} / {event.referrer}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
                Recent page traffic will appear here once people start browsing the live site.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
