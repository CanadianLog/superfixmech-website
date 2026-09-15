"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/site-data";

type ContactState = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: ContactState = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<ContactState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const isValid = useMemo(() => {
    const hasValues =
      form.fullName.trim() &&
      form.email.trim() &&
      form.subject.trim() &&
      form.message.trim();
    const validEmail = /\S+@\S+\.\S+/.test(form.email);
    return Boolean(hasValues && validEmail);
  }, [form]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!isValid) {
      return;
    }
    const body = [
      `From: ${form.fullName} <${form.email}>`,
      "",
      form.message,
    ].join("\n");
    const mailto = `mailto:${encodeURIComponent(company.email)}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setForm(initialState);
    setSubmitted(false);
    setToastMessage("Your email client will open. Send the message to reach us.");
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 5000);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="surface grid gap-4 p-5 md:p-8">
        <label className="text-sm font-semibold text-[#5f4714]">
          Full Name *
          <input
            type="text"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d6a52d]"
          />
        </label>
        <label className="text-sm font-semibold text-[#5f4714]">
          Email *
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d6a52d]"
          />
        </label>
        <label className="text-sm font-semibold text-[#5f4714]">
          Subject *
          <input
            type="text"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d6a52d]"
          />
        </label>
        <label className="text-sm font-semibold text-[#5f4714]">
          Message *
          <textarea
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            rows={6}
            className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d6a52d]"
          />
        </label>
        {submitted && !isValid && (
          <p className="text-sm font-medium text-red-600">
            Please fill all required fields and use a valid email.
          </p>
        )}
        <div>
          <Button type="submit">Submit</Button>
        </div>
      </form>
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#7a5d1f] px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {toastMessage || "Message submitted successfully."}
        </div>
      )}
    </>
  );
}
