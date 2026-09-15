"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { company } from "@/lib/site-data";

type BookingState = {
  clientType: string;
  serviceType: string;
  appliance: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  message: string;
};

const initialBooking: BookingState = {
  clientType: "Homeowner",
  serviceType: "Repair",
  appliance: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  message: "",
};

export function BookingForm() {
  const [form, setForm] = useState<BookingState>(initialBooking);
  const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const valid = useMemo(() => {
    const required =
      form.appliance &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.address.trim() &&
      form.city.trim() &&
      form.postalCode.trim();
    return Boolean(required && /\S+@\S+\.\S+/.test(form.email));
  }, [form]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (!valid) {
      return;
    }
    const subject = `[Booking] ${form.serviceType} – ${form.appliance} – ${form.firstName} ${form.lastName}`;
    const bodyLines = [
      "Booking request from website",
      "",
      "Client type: " + form.clientType,
      "Service type: " + form.serviceType,
      "Appliance: " + form.appliance,
      "Name: " + form.firstName + " " + form.lastName,
      "Email: " + form.email,
      "Phone: " + form.phone,
      "Address: " + form.address,
      "City: " + form.city,
      "Postal code: " + form.postalCode,
    ];
    if (form.message.trim()) {
      bodyLines.push("", "Message / Note / Comment:", form.message.trim());
    }
    const body = bodyLines.join("\n");
    const mailto = `mailto:${encodeURIComponent(company.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setForm(initialBooking);
    setSubmitted(false);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 5000);
  };

  const appliances = [
    "Refrigerator",
    "Dishwasher",
    "Freezer",
    "Built-in Oven",
    "Stove/Cooktop",
    "Range Hood",
    "Washer",
    "Dryer",
    "Microwave",
    "Air Exchanger",
    "Other",
  ];

  return (
    <>
      <form onSubmit={onSubmit} className="surface grid gap-5 p-5 md:p-8">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#5f4714]">
            Client Type
            <select
              value={form.clientType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, clientType: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm"
            >
              <option>Homeowner</option>
              <option>Property Management</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[#5f4714]">
            Service Type
            <select
              value={form.serviceType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, serviceType: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm"
            >
              <option>Repair</option>
              <option>Installation</option>
            </select>
          </label>
        </div>

        <label className="text-sm font-semibold text-[#5f4714]">
          Choose Your Appliance *
          <select
            value={form.appliance}
            onChange={(event) => setForm((prev) => ({ ...prev, appliance: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm"
          >
            <option value="">Select appliance</option>
            {appliances.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#5f4714]">
            First Name *
            <input
              type="text"
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-[#f1dfab] px-3 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-[#5f4714]">
            Last Name *
            <input
              type="text"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-[#f1dfab] px-3 py-3 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#5f4714]">
            Email *
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-[#f1dfab] px-3 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-[#5f4714]">
            Phone *
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-[#f1dfab] px-3 py-3 text-sm"
            />
          </label>
        </div>

        <label className="text-sm font-semibold text-[#5f4714]">
          Address *
          <input
            type="text"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[#f1dfab] px-3 py-3 text-sm"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-semibold text-[#5f4714]">
            City *
            <input
              type="text"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-[#f1dfab] px-3 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-[#5f4714]">
            Postal Code *
            <input
              type="text"
              value={form.postalCode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, postalCode: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-[#f1dfab] px-3 py-3 text-sm"
            />
          </label>
        </div>

        <label className="text-sm font-semibold text-[#5f4714]">
          Message / Note / Comment <span className="font-normal text-[#7e6b45]">(optional)</span>
          <textarea
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            rows={4}
            placeholder="Any details about the issue, preferred times, or special instructions..."
            className="mt-2 w-full rounded-xl border border-[#f1dfab] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d6a52d] placeholder:text-[#9a8457]"
          />
        </label>

        {submitted && !valid && (
          <p className="text-sm font-semibold text-red-600">
            Please fill in all required fields (appliance, name, email, phone, address, city, postal code).
          </p>
        )}
        <div>
          <Button type="submit">Submit Request</Button>
        </div>
      </form>
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#7a5d1f] px-4 py-3 text-sm font-semibold text-white shadow-xl">
          Your email client will open. Send the message to submit your booking request.
        </div>
      )}
    </>
  );
}
