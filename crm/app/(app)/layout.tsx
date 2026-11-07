import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { logout } from "@/lib/actions";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const company = getSettings().company_name || "SuperFix";
  return (
    <Shell user={{ name: user.name, role: user.role, color: user.color }} company={company} logout={logout}>
      {children}
    </Shell>
  );
}
