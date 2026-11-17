import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

/** The signed-in user, and whether they are listed in the `admins` table. */
export async function getSession() {
  if (!isSupabaseConfigured()) return { supabase: null, user: null, isAdmin: false } as const;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, isAdmin: false } as const;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, user: data.user, isAdmin: isAdmin === true } as const;
}

/** For admin pages and actions: sends everyone else to the login page. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.supabase || !session.user || !session.isAdmin) redirect("/admin/login");
  return { supabase: session.supabase, user: session.user };
}
