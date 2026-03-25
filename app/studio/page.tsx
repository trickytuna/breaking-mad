import { readFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/studio/actions";
import { SetupSqlPanel } from "@/app/studio/setup-sql-panel";
import { StudioDashboard } from "@/app/studio/studio-dashboard";
import { getStudioPhotos } from "@/lib/photo-gallery";
import { getSiteVisitCount } from "@/lib/site-engagement";
import { getStudioAccessState } from "@/lib/studio-auth";
import { getStudioPosts } from "@/lib/site-content";

export const dynamic = "force-dynamic";

function getStatusMessage(status?: string) {
  switch (status) {
    case "created":
      return "Post created.";
    case "updated":
      return "Post updated.";
    case "deleted":
      return "Post deleted.";
    case "duplicate":
      return "That slug is already in use. Choose a different slug.";
    case "invalid":
      return "Please fill in the title, excerpt, body, and slug.";
    case "documents":
      return "Please complete each document title and URL before saving.";
    case "setup":
      return "The content database still needs to be set up in Supabase.";
    case "config":
      return "Supabase environment variables still need to be configured for this deployment.";
    case "denied":
      return "This account is signed in, but it is not allowed to use the studio.";
    case "error":
      return "Something went wrong while saving. Please try again.";
    default:
      return null;
  }
}

async function getSetupSql() {
  try {
    return await readFile(
      path.join(process.cwd(), "supabase", "site_content.sql"),
      "utf8"
    );
  } catch {
    return "";
  }
}

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const access = await getStudioAccessState();

  const resolvedSearchParams = await searchParams;
  const status =
    typeof resolvedSearchParams.status === "string"
      ? resolvedSearchParams.status
      : undefined;
  const message = getStatusMessage(status);

  if (!access.isConfigured) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-white">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
          Studio
        </p>
        <h1 className="text-5xl font-black uppercase">Connection Required</h1>
        <section className="mt-8 rounded-3xl border border-amber-400/40 bg-amber-400/10 p-6 text-amber-100">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200">
            Studio Status
          </p>
          <h2 className="mt-3 text-2xl font-black uppercase">
            Supabase Environment Missing
          </h2>
          <p className="mt-3 text-sm">
            This deployment is live, but studio authentication has not been
            connected to Supabase yet. Add the public Supabase environment
            variables in Vercel, redeploy, then return here to finish database
            setup if prompted.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-300/20 bg-black/20 p-4 text-sm">
              1. In Vercel, add `NEXT_PUBLIC_SUPABASE_URL`.
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-black/20 p-4 text-sm">
              2. Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-black/20 p-4 text-sm">
              3. Redeploy and reopen `/studio`.
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!access.isAuthenticated) {
    redirect("/login");
  }

  if (!access.isAllowed) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-white">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
          Studio
        </p>
        <h1 className="text-5xl font-black uppercase">Access Restricted</h1>
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-lg text-zinc-300">
            Signed in as {access.email ?? "an authenticated user"}, but this
            account is not currently allowed to use the studio.
          </p>
          <p className="mt-4 text-zinc-400">
            If you want to lock the studio to specific accounts, set
            `SITE_ADMIN_EMAILS` in your environment as a comma-separated list of
            allowed emails.
          </p>
          <form action={signOutAction} className="mt-6">
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-4 py-3 font-bold text-white"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    );
  }

  const [{ posts, schemaReady }, { photos, schemaReady: photoSchemaReady }, siteVisits] =
    await Promise.all([getStudioPosts(), getStudioPhotos(), getSiteVisitCount()]);
  const setupSql = schemaReady ? "" : await getSetupSql();

  return (
    <main className="mx-auto max-w-7xl px-6 py-20 text-white">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">
            Studio
          </p>
          <h1 className="text-5xl font-black uppercase">Website Publishing Studio</h1>
          <p className="mt-4 max-w-4xl text-lg text-zinc-300">
            Manage work launches and journal entries directly from the website.
            Draft, preview, attach launch materials, and publish without working in folders.
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-zinc-500">
            Signed in as {access.email ?? "an authenticated user"}
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-700 px-4 py-3 font-bold text-white transition hover:border-cyan-400"
          >
            Sign Out
          </button>
        </form>
      </div>

      {message ? (
        <div className="mt-8 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          {message}
        </div>
      ) : null}

      <section
        className={`mt-8 rounded-3xl border p-6 ${
          schemaReady
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
            : "border-amber-400/40 bg-amber-400/10 text-amber-100"
        }`}
      >
        <p
          className={`text-sm uppercase tracking-[0.3em] ${
            schemaReady ? "text-emerald-200" : "text-amber-200"
          }`}
        >
          Studio Status
        </p>
        <h2 className="mt-3 text-2xl font-black uppercase">
          {schemaReady ? "Initialized and Ready" : "Initialization Required"}
        </h2>
        <p className="mt-3 max-w-4xl text-sm">
          {schemaReady
            ? "The website is connected to the content database. You can create, edit, save drafts, publish, and manage launch materials directly from this page."
            : "The website can reach the studio route, but the Supabase content table is not set up yet. Run the one-time setup script below, then refresh this page."}
        </p>
      </section>

      {!schemaReady ? (
        <section className="mt-10 rounded-3xl border border-amber-400/40 bg-amber-400/10 p-6 text-amber-100">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200">
            One-Time Setup
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase">
            Connect the Content Database
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-300/20 bg-black/20 p-4 text-sm">
              1. Open your Supabase project and go to the SQL Editor.
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-black/20 p-4 text-sm">
              2. Paste the setup script below and run it once.
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-black/20 p-4 text-sm">
              3. Refresh this page and the publishing studio will be ready.
            </div>
          </div>

          {setupSql ? (
            <SetupSqlPanel sql={setupSql} />
          ) : null}
        </section>
      ) : (
        <StudioDashboard
          posts={posts}
          photos={photos}
          photoSchemaReady={photoSchemaReady}
          siteVisits={siteVisits}
        />
      )}
    </main>
  );
}
