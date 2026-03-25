export type WorkReaction = "like" | "dislike";

export interface SiteVisitState {
  count: number;
  enabled: boolean;
}

export interface WorkReactionSummary {
  likeCount: number;
  dislikeCount: number;
  currentReaction: WorkReaction | null;
  enabled: boolean;
}

export const EMPTY_SITE_VISIT_STATE: SiteVisitState = {
  count: 0,
  enabled: false,
};

export const EMPTY_WORK_REACTION_SUMMARY: WorkReactionSummary = {
  likeCount: 0,
  dislikeCount: 0,
  currentReaction: null,
  enabled: false,
};

export function isWorkReaction(value: unknown): value is WorkReaction {
  return value === "like" || value === "dislike";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
