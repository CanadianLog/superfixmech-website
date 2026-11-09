import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listUsers } from "@/lib/data";
import { saveUser, toggleUserActive } from "@/lib/actions";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import type { User } from "@/lib/types";

export const metadata = { title: "Team" };

const ROLE_INFO: Record<string, string> = {
  admin: "Everything, including team, settings and deleting records.",
  dispatcher: "Customers, jobs, schedule, estimates, invoices, price book, reports.",
  tech: "Only their own jobs: status updates, notes, line items, invoices and payments.",
};

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const me = await requireUser(["admin"]);
  const { edit } = await searchParams;
  const users = listUsers(true);
  const editing = users.find((u) => String(u.id) === edit);
  return (
    <>
      <PageHeader title="Team" subtitle="Everyone who can sign in. Technicians show up on the schedule in their colour." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card pad={false} className="xl:col-span-2">
          <ul className="divide-y divide-stone-100">
            {users.map((u) => (
              <li key={u.id} className={`flex items-center gap-3 px-5 py-3 ${u.active ? "" : "opacity-50"}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: u.color }}>
                  {u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{u.name} {u.id === me.id && <span className="text-xs font-normal text-stone-400">(you)</span>}</div>
                  <div className="truncate text-xs text-stone-500">{u.email}{u.phone ? ` · ${u.phone}` : ""}</div>
                </div>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold capitalize text-stone-600">{u.role === "tech" ? "Technician" : u.role}</span>
                <Link href={`/team?edit=${u.id}`} className="text-xs text-stone-500 hover:text-stone-900">Edit</Link>
                {u.id !== me.id && (
                  <form action={toggleUserActive}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="text-xs text-stone-500 hover:text-stone-900">{u.active ? "Deactivate" : "Reactivate"}</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title={editing ? `Edit ${editing.name}` : "Add team member"} className="self-start">
          <UserForm key={editing?.id ?? "new"} user={editing} />
        </Card>
      </div>
    </>
  );
}

function UserForm({ user }: { user?: User }) {
  return (
    <ActionForm action={saveUser} className="space-y-3">
      {user && <input type="hidden" name="id" value={user.id} />}
      <label className="block"><span className="label">Name</span><input className="input" name="name" defaultValue={user?.name} required /></label>
      <label className="block"><span className="label">Email (used to sign in)</span><input className="input" type="email" name="email" defaultValue={user?.email} required /></label>
      <label className="block"><span className="label">Phone</span><input className="input" type="tel" name="phone" defaultValue={user?.phone} /></label>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="block"><span className="label">Role</span>
          <select className="input" name="role" defaultValue={user?.role ?? "tech"}>
            <option value="tech">Technician</option><option value="dispatcher">Dispatcher / office</option><option value="admin">Admin</option>
          </select>
        </label>
        <label className="block"><span className="label">Colour</span><input className="h-[38px] w-14 cursor-pointer rounded-lg border border-stone-300" type="color" name="color" defaultValue={user?.color ?? "#2563eb"} /></label>
      </div>
      <ul className="space-y-1 rounded-lg bg-stone-50 p-3 text-xs text-stone-600">
        {Object.entries(ROLE_INFO).map(([r, t]) => <li key={r}><b className="capitalize">{r === "tech" ? "Technician" : r}:</b> {t}</li>)}
      </ul>
      <label className="block"><span className="label">{user ? "New password (leave blank to keep)" : "Starting password"}</span><input className="input" type="text" name="password" autoComplete="new-password" minLength={user ? undefined : 8} required={!user} /></label>
      <div className="flex justify-end gap-2">
        {user && <Link href="/team" className="btn-ghost">Cancel</Link>}
        <SubmitButton>{user ? "Save" : "Add member"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
