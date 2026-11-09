import { redirect } from "next/navigation";
import { currentUser, hasUsers } from "@/lib/auth";
import { login } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/ui";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (!hasUsers()) redirect("/setup");
  if (await currentUser()) redirect("/");
  return (
    <AuthCard title="Sign in" subtitle="Welcome back. Sign in to see today's jobs.">
      <ActionForm action={login} className="space-y-4">
        <Field label="Email">
          <input className="input" type="email" name="email" autoComplete="email" required autoFocus />
        </Field>
        <Field label="Password">
          <input className="input" type="password" name="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </ActionForm>
      <p className="mt-4 text-xs text-stone-500">Forgot your password? Ask an admin to reset it on the Team page.</p>
    </AuthCard>
  );
}
