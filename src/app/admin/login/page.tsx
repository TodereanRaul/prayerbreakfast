import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/brand";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const instant = false;
export const metadata = { title: "Sign in" };

function SetupNotice() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-navy-700">
      <p className="font-semibold text-navy-900">Supabase is not connected yet.</p>
      <p>
        The website currently shows the built-in list of events. To edit it here, add the Supabase
        project URL and key to <code className="rounded bg-navy-50 px-1.5 py-0.5">.env.local</code>,
        as described in the README, then reload this page.
      </p>
    </div>
  );
}

async function LoginOrRedirect() {
  const session = await getSession();
  if (session.user && session.isAdmin) redirect("/admin");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center" aria-label="Prayer Breakfasts, home">
          <Logo variant="stacked" height={176} priority />
        </Link>
        <div className="mt-8 rounded-2xl bg-white p-7 shadow-xl shadow-navy-900/5 ring-1 ring-navy-900/10">
          <h1 className="font-display text-3xl font-medium">Administration</h1>
          <p className="mt-1 mb-6 text-sm text-navy-500">Sign in to update the calendar.</p>
          {isSupabaseConfigured() ? (
            <Suspense fallback={<p className="text-sm text-navy-500">Loading…</p>}>
              <LoginOrRedirect />
            </Suspense>
          ) : (
            <SetupNotice />
          )}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-navy-500 underline-offset-4 hover:text-navy-900 hover:underline">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
