import { NextResponse, type NextRequest } from "next/server";
import {
  getWorkReactionSummary,
  setWorkReaction,
} from "@/lib/site-engagement";
import {
  EMPTY_WORK_REACTION_SUMMARY,
  isUuid,
  isWorkReaction,
} from "@/lib/site-engagement-shared";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE_NAME = "bm_visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function getVisitorId(request: NextRequest) {
  const value = request.cookies.get(VISITOR_COOKIE_NAME)?.value ?? null;
  return value && isUuid(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");

  if (!postId || !isUuid(postId)) {
    return NextResponse.json(EMPTY_WORK_REACTION_SUMMARY, { status: 200 });
  }

  try {
    const summary = await getWorkReactionSummary(postId, getVisitorId(request));
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(EMPTY_WORK_REACTION_SUMMARY, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      postId?: string;
      reaction?: string;
    };

    if (!body.postId || !isUuid(body.postId) || !isWorkReaction(body.reaction)) {
      return NextResponse.json(EMPTY_WORK_REACTION_SUMMARY, { status: 400 });
    }

    const visitorId = getVisitorId(request) ?? crypto.randomUUID();
    const summary = await setWorkReaction(body.postId, visitorId, body.reaction);
    const response = NextResponse.json(summary);

    if (getVisitorId(request) === null && summary.enabled) {
      response.cookies.set({
        name: VISITOR_COOKIE_NAME,
        value: visitorId,
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch {
    return NextResponse.json(EMPTY_WORK_REACTION_SUMMARY, { status: 200 });
  }
}
