import { redirect } from "next/navigation";
import { hasUsers } from "@/lib/auth";
import { setupAdmin } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/ui";

export const metadata = { title: "Set up" };

export default function SetupPage() {
  if (hasUsers()) redirect("/login");
  return (
    <AuthCard title="Set up your CRM" subtitle="Create the owner account. You can add your team afterwards.">
      <ActionForm action={setupAdmin} className="space-y-4">
        <Field label="Company name">
          <input className="input" name="company" defaultValue="SuperFix Mechanical Inc." />
        </Field>
        <Field label="Your name">
          <input className="input" name="name" required autoFocus />
        </Field>
        <Field label="Email">
          <input className="input" type="email" name="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input className="input" type="password" name="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="btn-primary w-full" pendingText="Creating…">
          Create account
        </SubmitButton>
      </ActionForm>
    </AuthCard>
  );
}
