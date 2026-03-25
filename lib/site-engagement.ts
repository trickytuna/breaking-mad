import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  EMPTY_SITE_VISIT_STATE,
  EMPTY_WORK_REACTION_SUMMARY,
  isUuid,
  isWorkReaction,
  type SiteVisitState,
  type WorkReaction,
  type WorkReactionSummary,
} from "@/lib/site-engagement-shared";

interface WorkReactionSummaryRow {
  like_count?: number | string | null;
  dislike_count?: number | string | null;
  current_reaction?: string | null;
}

function normalizeCount(value: number | string | null | undefined) {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function normalizeReaction(value: string | null | undefined): WorkReaction | null {
  return isWorkReaction(value) ? value : null;
}

function normalizeSummary(data: unknown): WorkReactionSummary {
  const row = (Array.isArray(data) ? data[0] : data) as WorkReactionSummaryRow | null;

  return {
    likeCount: normalizeCount(row?.like_count),
    dislikeCount: normalizeCount(row?.dislike_count),
    currentReaction: normalizeReaction(row?.current_reaction),
    enabled: true,
  };
}

function isEngagementSetupError(error: { code?: string | null; message?: string | null } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    error?.message?.includes("site_metrics") === true ||
    error?.message?.includes("site_post_reactions") === true ||
    error?.message?.includes("get_site_visits") === true ||
    error?.message?.includes("increment_site_visits") === true ||
    error?.message?.includes("get_work_reaction_summary") === true ||
    error?.message?.includes("set_work_reaction") === true
  );
}

export async function getSiteVisitCount(): Promise<SiteVisitState> {
  if (!getSupabaseEnv().isConfigured) {
    return EMPTY_SITE_VISIT_STATE;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_site_visits");

  if (isEngagementSetupError(error)) {
    return EMPTY_SITE_VISIT_STATE;
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: normalizeCount(data as number | string | null | undefined),
    enabled: true,
  };
}

export async function incrementSiteVisitCount(): Promise<SiteVisitState> {
  if (!getSupabaseEnv().isConfigured) {
    return EMPTY_SITE_VISIT_STATE;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("increment_site_visits");

  if (isEngagementSetupError(error)) {
    return EMPTY_SITE_VISIT_STATE;
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: normalizeCount(data as number | string | null | undefined),
    enabled: true,
  };
}

export async function getWorkReactionSummary(
  postId: string,
  visitorId?: string | null
): Promise<WorkReactionSummary> {
  if (!getSupabaseEnv().isConfigured || !isUuid(postId)) {
    return EMPTY_WORK_REACTION_SUMMARY;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_work_reaction_summary", {
    target_post_id: postId,
    target_visitor_id: visitorId ?? null,
  });

  if (isEngagementSetupError(error)) {
    return EMPTY_WORK_REACTION_SUMMARY;
  }

  if (error) {
    throw new Error(error.message);
  }

  return normalizeSummary(data);
}

export async function setWorkReaction(
  postId: string,
  visitorId: string,
  reaction: WorkReaction
): Promise<WorkReactionSummary> {
  if (!getSupabaseEnv().isConfigured || !isUuid(postId) || !isUuid(visitorId)) {
    return EMPTY_WORK_REACTION_SUMMARY;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_work_reaction", {
    target_post_id: postId,
    target_visitor_id: visitorId,
    target_reaction: reaction,
  });

  if (isEngagementSetupError(error)) {
    return EMPTY_WORK_REACTION_SUMMARY;
  }

  if (error) {
    throw new Error(error.message);
  }

  return normalizeSummary(data);
}
