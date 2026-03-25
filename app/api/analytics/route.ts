import { NextResponse, userAgent, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  isAnalyticsEventType,
  type AnalyticsClientEvent,
} from "@/lib/site-analytics-shared";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE_NAME = "bm_visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SESSION_COOKIE_NAME = "bm_session_id";
const SESSION_COOKIE_MAX_AGE = 60 * 30;

function readUuidCookie(request: NextRequest, name: string) {
  const value = request.cookies.get(name)?.value ?? "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
    ? value
    : null;
}

function normalizePathname(value: string) {
  const pathname = value.trim();
  return pathname.startsWith("/") && pathname.length <= 256 ? pathname : "/";
}

function normalizeSearch(value: string) {
  const search = value.trim();
  return search.length <= 512 ? search : "";
}

function normalizeText(value: string, maxLength = 120) {
  return value.trim().slice(0, maxLength);
}

function getContentSection(pathname: string, body: AnalyticsClientEvent) {
  if (body.contentSection) {
    return body.contentSection;
  }

  if (pathname.startsWith("/work/")) {
    return "work";
  }

  if (pathname.startsWith("/journal/")) {
    return "journal";
  }

  return null;
}

function getContentSlug(pathname: string, body: AnalyticsClientEvent) {
  if (body.contentSlug) {
    return normalizeText(body.contentSlug, 200);
  }

  const parts = pathname.split("/").filter(Boolean);
  return parts.length > 1 ? normalizeText(parts[1], 200) : "";
}

function getReferrerHost(referrer: string, request: NextRequest) {
  if (!referrer) {
    return "";
  }

  try {
    const referrerUrl = new URL(referrer);
    return referrerUrl.host === request.nextUrl.host ? "Internal" : referrerUrl.host;
  } catch {
    return "";
  }
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

export async function POST(request: NextRequest) {
  if (!getSupabaseEnv().isConfigured) {
    return NextResponse.json({
      ok: true,
      enabled: false,
    });
  }

  try {
    const body = (await request.json()) as AnalyticsClientEvent;

    if (!isAnalyticsEventType(body.eventType)) {
      return NextResponse.json(
        {
          ok: false,
          enabled: false,
        },
        { status: 400 }
      );
    }

    const ua = userAgent(request);

    if (ua.isBot) {
      return NextResponse.json({
        ok: true,
        enabled: true,
        skipped: true,
      });
    }

    const pathname = normalizePathname(String(body.pathname ?? "/"));
    const search = normalizeSearch(String(body.search ?? ""));
    const referrer = normalizeText(String(body.referrer ?? ""), 500);
    const visitorId = readUuidCookie(request, VISITOR_COOKIE_NAME) ?? crypto.randomUUID();
    const sessionId = readUuidCookie(request, SESSION_COOKIE_NAME) ?? crypto.randomUUID();
    const searchParams = new URLSearchParams(search);
    const supabase = await createClient();

    const { error } = await supabase.from("site_analytics_events").insert({
      event_type: body.eventType,
      pathname,
      content_section: getContentSection(pathname, body),
      content_slug: getContentSlug(pathname, body),
      target_label: normalizeText(String(body.targetLabel ?? ""), 160),
      target_url: normalizeText(String(body.targetUrl ?? ""), 500),
      referrer_host: getReferrerHost(referrer, request),
      utm_source: normalizeText(searchParams.get("utm_source") ?? "", 120),
      utm_medium: normalizeText(searchParams.get("utm_medium") ?? "", 120),
      utm_campaign: normalizeText(searchParams.get("utm_campaign") ?? "", 160),
      country: normalizeText(request.headers.get("x-vercel-ip-country") ?? "", 80),
      region: normalizeText(
        request.headers.get("x-vercel-ip-country-region") ?? "",
        80
      ),
      city: normalizeText(request.headers.get("x-vercel-ip-city") ?? "", 120),
      timezone: normalizeText(String(body.timezone ?? ""), 120),
      browser_name: normalizeText(ua.browser.name ?? "", 80),
      os_name: normalizeText(ua.os.name ?? "", 80),
      device_type: normalizeText(ua.device.type ?? "desktop", 40),
      visitor_id: visitorId,
      session_id: sessionId,
    });

    if (isAnalyticsSetupError(error)) {
      return NextResponse.json({
        ok: true,
        enabled: false,
      });
    }

    if (error) {
      throw new Error(error.message);
    }

    const response = NextResponse.json({
      ok: true,
      enabled: true,
    });

    response.cookies.set({
      name: VISITOR_COOKIE_NAME,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json({
      ok: true,
      enabled: false,
    });
  }
}
