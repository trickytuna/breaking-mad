export type AnalyticsEventType = "page_view" | "launch_document_click";

export interface AnalyticsClientEvent {
  eventType: AnalyticsEventType;
  pathname: string;
  search?: string;
  referrer?: string;
  timezone?: string;
  contentSection?: "journal" | "work";
  contentSlug?: string;
  targetLabel?: string;
  targetUrl?: string;
}

export interface AnalyticsOverview {
  totalPageViews: number;
  uniqueVisitors: number;
  sessions: number;
  documentClicks: number;
  countriesTracked: number;
  pageViewsLast7Days: number;
}

export interface AnalyticsSummaryItem {
  label: string;
  value: number;
  secondaryValue?: number;
  href?: string;
  detail?: string;
}

export interface TopWorkAnalyticsItem {
  title: string;
  slug: string;
  views: number;
  documentClicks: number;
  likes: number;
  dislikes: number;
}

export interface RecentTrafficItem {
  pathname: string;
  viewedAt: string;
  country: string;
  device: string;
  referrer: string;
}

export interface StudioAnalytics {
  enabled: boolean;
  overview: AnalyticsOverview;
  topPages: AnalyticsSummaryItem[];
  topReferrers: AnalyticsSummaryItem[];
  topCountries: AnalyticsSummaryItem[];
  topDevices: AnalyticsSummaryItem[];
  topBrowsers: AnalyticsSummaryItem[];
  topCampaigns: AnalyticsSummaryItem[];
  topWorks: TopWorkAnalyticsItem[];
  recentTraffic: RecentTrafficItem[];
}

export const EMPTY_STUDIO_ANALYTICS: StudioAnalytics = {
  enabled: false,
  overview: {
    totalPageViews: 0,
    uniqueVisitors: 0,
    sessions: 0,
    documentClicks: 0,
    countriesTracked: 0,
    pageViewsLast7Days: 0,
  },
  topPages: [],
  topReferrers: [],
  topCountries: [],
  topDevices: [],
  topBrowsers: [],
  topCampaigns: [],
  topWorks: [],
  recentTraffic: [],
};

export function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return value === "page_view" || value === "launch_document_click";
}
