import { requireUser } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/actions";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="My account" subtitle={`${me.name} · ${me.email}`} />
      <Card title="Change password">
        <ActionForm action={changeOwnPassword} className="space-y-3">
          <label className="block"><span className="label">Current password</span><input className="input" type="password" name="current" autoComplete="current-password" required /></label>
          <label className="block"><span className="label">New password</span><input className="input" type="password" name="next" autoComplete="new-password" minLength={8} required /></label>
          <div className="flex justify-end"><SubmitButton>Change password</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}
