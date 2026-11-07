"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/actions";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText = "Saving…",
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}

/** A form bound to a server action that returns {error|ok}; shows the message inline. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.ok}
        </div>
      )}
      {children}
    </form>
  );
}

/** Button that asks for confirmation before submitting its form. */
export function ConfirmButton({ children, message, className = "btn-danger btn-sm" }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn-ghost btn-sm"
      onClick={async (e) => {
        const btn = e.currentTarget;
        const url = text.startsWith("/") ? `${window.location.origin}${text}` : text;
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = "Copied!";
        } catch {
          window.prompt("Copy this link:", url);
        }
        setTimeout(() => (btn.textContent = label), 1500);
      }}
    >
      {label}
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="btn-ghost" onClick={() => window.print()}>
      Print / PDF
    </button>
  );
}
