import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Prayer Breakfasts admin" },
  robots: { index: false, follow: false },
};

// The admin reads the signed-in session on every request, so these pages are
// rendered on demand rather than prerendered.
export const instant = false;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-col bg-cream">{children}</div>;
}
