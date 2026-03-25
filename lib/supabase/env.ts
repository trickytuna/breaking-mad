export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

  return {
    url,
    publishableKey,
    isConfigured: Boolean(url && publishableKey),
  };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env.isConfigured) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return env;
}
