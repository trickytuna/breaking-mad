import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  EMPTY_STUDIO_ANALYTICS,
  type AnalyticsOverview,
  type AnalyticsSummaryItem,
  type RecentTrafficItem,
  type StudioAnalytics,
  type TopWorkAnalyticsItem,
} from "@/lib/site-analytics-shared";

interface AnalyticsEventRow {
  event_type?: string | null;
  pathname?: string | null;
  content_section?: string | null;
  content_slug?: string | null;
  target_label?: string | null;
  target_url?: string | null;
  referrer_host?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  timezone?: string | null;
  browser_name?: string | null;
  os_name?: string | null;
  device_type?: string | null;
  visitor_id?: string | null;
  session_id?: string | null;
  created_at?: string | null;
}

interface ReactionRow {
  post_id?: string | null;
  reaction?: string | null;
}

interface WorkPostRow {
  id?: string | null;
  title?: string | null;
  slug?: string | null;
  status?: string | null;
  section?: string | null;
}

function isAnalyticsSetupError(
  error: { code?: string | null; message?: string | null } | null
) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    error?.code === "42703" ||
    error?.message?.includes("site_analytics_events") === true
  );
}

function normalizeLabel(value: string | null | undefined, fallback: string) {
  const label = String(value ?? "").trim();
  return label || fallback;
}

function createSummaryItems(
  entries: Map<string, { value: number; secondary?: Set<string> }>,
  options?: {
    hrefPrefix?: string;
  }
) {
  return Array.from(entries.entries())
    .map(([label, data]) => {
      const href =
        options?.hrefPrefix && label.startsWith("/")
          ? `${options.hrefPrefix}${label}`
          : undefined;

      return {
        label,
        value: data.value,
        secondaryValue: data.secondary ? data.secondary.size : undefined,
        href,
      } satisfies AnalyticsSummaryItem;
    })
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
}

function buildRecentTraffic(events: AnalyticsEventRow[]): RecentTrafficItem[] {
  return events
    .filter((event) => event.event_type === "page_view")
    .slice(0, 12)
    .map((event) => ({
      pathname: normalizeLabel(event.pathname, "/"),
      viewedAt: normalizeLabel(event.created_at, ""),
      country: normalizeLabel(event.country, "Unknown"),
      device: normalizeLabel(event.device_type, "desktop"),
      referrer: normalizeLabel(event.referrer_host, "Direct"),
    }));
}

function buildTopWorks(
  events: AnalyticsEventRow[],
  reactions: ReactionRow[],
  posts: WorkPostRow[]
) {
  const viewsBySlug = new Map<string, number>();
  const documentClicksBySlug = new Map<string, number>();
  const reactionsByPostId = new Map<string, { likes: number; dislikes: number }>();

  for (const event of events) {
    if (event.event_type === "page_view" && event.pathname?.startsWith("/work/")) {
      const slug = event.pathname.split("/")[2]?.trim();

      if (slug) {
        viewsBySlug.set(slug, (viewsBySlug.get(slug) ?? 0) + 1);
      }
    }

    if (event.event_type === "launch_document_click" && event.content_slug) {
      documentClicksBySlug.set(
        event.content_slug,
        (documentClicksBySlug.get(event.content_slug) ?? 0) + 1
      );
    }
  }

  for (const reaction of reactions) {
    const postId = String(reaction.post_id ?? "");

    if (!postId) {
      continue;
    }

    const current = reactionsByPostId.get(postId) ?? {
      likes: 0,
      dislikes: 0,
    };

    if (reaction.reaction === "like") {
      current.likes += 1;
    } else if (reaction.reaction === "dislike") {
      current.dislikes += 1;
    }

    reactionsByPostId.set(postId, current);
  }

  return posts
    .filter((post) => post.section === "work" && post.status === "published")
    .map((post) => {
      const slug = String(post.slug ?? "");
      const reactionSummary = reactionsByPostId.get(String(post.id ?? "")) ?? {
        likes: 0,
        dislikes: 0,
      };

      return {
        title: normalizeLabel(post.title, slug || "Untitled Work"),
        slug,
        views: viewsBySlug.get(slug) ?? 0,
        documentClicks: documentClicksBySlug.get(slug) ?? 0,
        likes: reactionSummary.likes,
        dislikes: reactionSummary.dislikes,
      } satisfies TopWorkAnalyticsItem;
    })
    .filter((item) => item.views || item.documentClicks || item.likes || item.dislikes)
    .sort((left, right) => {
      const leftScore = left.views * 5 + left.documentClicks * 3 + left.likes - left.dislikes;
      const rightScore =
        right.views * 5 + right.documentClicks * 3 + right.likes - right.dislikes;

      return rightScore - leftScore;
    })
    .slice(0, 6);
}

function buildOverview(events: AnalyticsEventRow[]): AnalyticsOverview {
  const pageViewEvents = events.filter((event) => event.event_type === "page_view");
  const documentClicks = events.filter(
    (event) => event.event_type === "launch_document_click"
  ).length;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const uniqueVisitors = new Set<string>();
  const uniqueSessions = new Set<string>();
  const countries = new Set<string>();

  let pageViewsLast7Days = 0;

  for (const event of pageViewEvents) {
    const visitorId = String(event.visitor_id ?? "").trim();
    const sessionId = String(event.session_id ?? "").trim();
    const country = String(event.country ?? "").trim();
    const viewedAt = new Date(String(event.created_at ?? "")).getTime();

    if (visitorId) {
      uniqueVisitors.add(visitorId);
    }

    if (sessionId) {
      uniqueSessions.add(sessionId);
    }

    if (country) {
      countries.add(country);
    }

    if (Number.isFinite(viewedAt) && viewedAt >= sevenDaysAgo) {
      pageViewsLast7Days += 1;
    }
  }

  return {
    totalPageViews: pageViewEvents.length,
    uniqueVisitors: uniqueVisitors.size,
    sessions: uniqueSessions.size,
    documentClicks,
    countriesTracked: countries.size,
    pageViewsLast7Days,
  };
}

export async function getStudioAnalytics(): Promise<StudioAnalytics> {
  if (!getSupabaseEnv().isConfigured) {
    return EMPTY_STUDIO_ANALYTICS;
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: events, error: eventError }, { data: reactions }, { data: posts }] =
    await Promise.all([
      supabase
        .from("site_analytics_events")
        .select(
          "event_type, pathname, content_section, content_slug, target_label, target_url, referrer_host, utm_source, utm_medium, utm_campaign, country, region, city, timezone, browser_name, os_name, device_type, visitor_id, session_id, created_at"
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase.from("site_post_reactions").select("post_id, reaction"),
      supabase
        .from("site_posts")
        .select("id, title, slug, status, section")
        .eq("section", "work"),
    ]);

  if (isAnalyticsSetupError(eventError)) {
    return EMPTY_STUDIO_ANALYTICS;
  }

  if (eventError) {
    throw new Error(eventError.message);
  }

  const analyticsEvents = (events ?? []) as AnalyticsEventRow[];
  const pageEvents = analyticsEvents.filter((event) => event.event_type === "page_view");

  const topPages = new Map<string, { value: number; secondary: Set<string> }>();
  const topReferrers = new Map<string, { value: number }>();
  const topCountries = new Map<string, { value: number }>();
  const topDevices = new Map<string, { value: number }>();
  const topBrowsers = new Map<string, { value: number }>();
  const topCampaigns = new Map<string, { value: number }>();

  for (const event of pageEvents) {
    const pathname = normalizeLabel(event.pathname, "/");
    const visitorId = String(event.visitor_id ?? "").trim();
    const referrer = normalizeLabel(event.referrer_host, "Direct");
    const country = normalizeLabel(event.country, "Unknown");
    const device = normalizeLabel(event.device_type, "desktop");
    const browser = normalizeLabel(event.browser_name, "Unknown");
    const campaignSource = String(event.utm_source ?? "").trim();
    const campaignName = String(event.utm_campaign ?? "").trim();
    const campaignLabel =
      campaignSource || campaignName
        ? `${campaignSource || "direct"} / ${campaignName || "(no campaign)"}`
        : "";

    const pageEntry = topPages.get(pathname) ?? {
      value: 0,
      secondary: new Set<string>(),
    };
    pageEntry.value += 1;

    if (visitorId) {
      pageEntry.secondary.add(visitorId);
    }

    topPages.set(pathname, pageEntry);
    topCountries.set(country, {
      value: (topCountries.get(country)?.value ?? 0) + 1,
    });
    topDevices.set(device, {
      value: (topDevices.get(device)?.value ?? 0) + 1,
    });
    topBrowsers.set(browser, {
      value: (topBrowsers.get(browser)?.value ?? 0) + 1,
    });

    if (referrer !== "Direct" && referrer !== "Internal") {
      topReferrers.set(referrer, {
        value: (topReferrers.get(referrer)?.value ?? 0) + 1,
      });
    }

    if (campaignLabel) {
      topCampaigns.set(campaignLabel, {
        value: (topCampaigns.get(campaignLabel)?.value ?? 0) + 1,
      });
    }
  }

  return {
    enabled: true,
    overview: buildOverview(analyticsEvents),
    topPages: createSummaryItems(topPages, {
      hrefPrefix: "",
    }),
    topReferrers: Array.from(topReferrers.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    topCountries: Array.from(topCountries.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    topDevices: Array.from(topDevices.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    topBrowsers: Array.from(topBrowsers.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    topCampaigns: Array.from(topCampaigns.entries())
      .map(([label, data]) => ({
        label,
        value: data.value,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6),
    topWorks: buildTopWorks(
      analyticsEvents,
      ((reactions ?? []) as ReactionRow[]) ?? [],
      ((posts ?? []) as WorkPostRow[]) ?? []
    ),
    recentTraffic: buildRecentTraffic(analyticsEvents),
  };
}
