import { createClient } from "@/lib/supabase/server";

function parseAdminEmails() {
  return (process.env.SITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getStudioAccessState() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : null;
  const adminEmails = parseAdminEmails();
  const isAuthenticated = !error && !!claims;
  const isAllowed =
    isAuthenticated && (adminEmails.length === 0 || (email !== null && adminEmails.includes(email)));

  return {
    supabase,
    email,
    adminEmails,
    isAuthenticated,
    isAllowed,
  };
}

export async function requireStudioAccess() {
  const access = await getStudioAccessState();

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
