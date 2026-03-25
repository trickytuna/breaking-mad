import { NextResponse, type NextRequest } from "next/server";
import {
  getSiteVisitCount,
  incrementSiteVisitCount,
} from "@/lib/site-engagement";

export const dynamic = "force-dynamic";

const VISIT_COOKIE_NAME = "bm_site_visit_counted";
const VISIT_COOKIE_MAX_AGE = 60 * 60 * 12;

export async function POST(request: NextRequest) {
  try {
    const hasRecentVisitCookie = request.cookies.has(VISIT_COOKIE_NAME);
    const visitState = hasRecentVisitCookie
      ? await getSiteVisitCount()
      : await incrementSiteVisitCount();

    const response = NextResponse.json(visitState);

    if (!hasRecentVisitCookie && visitState.enabled) {
      response.cookies.set({
        name: VISIT_COOKIE_NAME,
        value: "1",
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: VISIT_COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        count: 0,
        enabled: false,
      },
      { status: 200 }
    );
  }
}
