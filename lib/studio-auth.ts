import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

type StudioSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type StudioAccessConfigured = {
  supabase: StudioSupabaseClient;
  email: string | null;
  adminEmails: string[];
  isConfigured: true;
  isAuthenticated: boolean;
  isAllowed: boolean;
};

type StudioAccessUnconfigured = {
  supabase: null;
  email: null;
  adminEmails: string[];
  isConfigured: false;
  isAuthenticated: false;
  isAllowed: false;
};

type StudioAccessState = StudioAccessConfigured | StudioAccessUnconfigured;

type StudioAccessResult =
  | {
      ok: false;
      reason: "setup" | "unauthenticated" | "forbidden";
    }
  | ({ ok: true } & StudioAccessConfigured);

function parseAdminEmails() {
  return (process.env.SITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getStudioAccessState(): Promise<StudioAccessState> {
  const adminEmails = parseAdminEmails();

  if (!getSupabaseEnv().isConfigured) {
    return {
      supabase: null,
      email: null,
      adminEmails,
      isConfigured: false,
      isAuthenticated: false,
      isAllowed: false,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : null;
  const isAuthenticated = !error && !!claims;
  const isAllowed =
    isAuthenticated && (adminEmails.length === 0 || (email !== null && adminEmails.includes(email)));

  return {
    supabase,
    email,
    adminEmails,
    isConfigured: true,
    isAuthenticated,
    isAllowed,
  };
}

export async function requireStudioAccess(): Promise<StudioAccessResult> {
  const access = await getStudioAccessState();

  if (!access.isConfigured) {
    return {
      ok: false as const,
      reason: "setup" as const,
    };
  }

  if (!access.isAuthenticated) {
    return {
      ok: false as const,
      reason: "unauthenticated" as const,
    };
  }

  if (!access.isAllowed) {
    return {
      ok: false as const,
      reason: "forbidden" as const,
    };
  }

  return {
    ok: true as const,
    ...access,
  };
}
