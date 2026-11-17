import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/admin/actions";
import { Logo } from "@/components/brand";
import { requireAdmin } from "@/lib/auth";

export const instant = false;

async function Guard({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // redirects to /admin/login when not an administrator
  return <>{children}</>;
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-4">
            <Logo variant="horizontal" tone="light" height={36} priority />
            <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.2em] uppercase sm:inline">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-white/10">Events</Link>
            <Link href="/admin/nations" className="rounded-full px-3 py-1.5 hover:bg-white/10">Nations</Link>
            <Link href="/" target="_blank" className="hidden rounded-full px-3 py-1.5 hover:bg-white/10 sm:block">View site ↗</Link>
            <form action={signOut}>
              <button type="submit" className="rounded-full px-3 py-1.5 text-navy-300 hover:bg-white/10 hover:text-white">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <Suspense fallback={<p className="text-sm text-navy-500">Loading…</p>}>
          <Guard>{children}</Guard>
        </Suspense>
      </main>
    </>
  );
}
