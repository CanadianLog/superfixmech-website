import { requireUser } from "@/lib/auth";
import { changeOwnPassword, resetMyCalendarLink, saveMyBusyCalendar } from "@/lib/actions";
import { Card, PageHeader } from "@/components/ui";
import { ActionForm, ConfirmButton, CopyButton, SubmitButton } from "@/components/forms";
import { calendarToken } from "@/lib/calendar";
import { get } from "@/lib/db";
import { appOrigin } from "@/lib/origin";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireUser();
  const origin = await appOrigin();
  const feed = `${origin}/api/calendar/${calendarToken(me.id)}.ics`;
  const webcal = feed.replace(/^https?:\/\//, "webcal://");
  const busyUrl = get<{ busy_calendar_url: string }>("SELECT busy_calendar_url FROM users WHERE id = ?", me.id)?.busy_calendar_url ?? "";
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="My account" subtitle={`${me.name} · ${me.email}`} />

      <div id="calendar" className="scroll-mt-6" />
      <Card title="Jobs on your iPhone calendar">
        <div className="space-y-3 text-sm text-stone-600">
          <p>
            Your {me.role === "tech" ? "jobs" : "scheduled jobs"} show up in the iPhone Calendar app (and on iCloud.com and your Mac), with the customer, address, phone and appliance. Changes in the CRM appear there within about 15 minutes.
          </p>
          <a href={webcal} className="btn-primary w-full justify-center">Add to iPhone Calendar</a>
          <p className="text-xs text-stone-500">
            Tap that on your iPhone and choose <b>Subscribe</b>. Or on any device: iPhone <b>Settings → Apps → Calendar → Calendar Accounts → Add Account → Other → Add Subscribed Calendar</b>, and paste the link below. To have it on every Apple device, set the account to <b>iCloud</b> when asked.
          </p>
          <div className="flex items-center gap-2">
            <input className="input text-xs" readOnly value={webcal} aria-label="Calendar link" />
            <CopyButton text={webcal} label="Copy" />
          </div>
          <form action={resetMyCalendarLink} className="text-right">
            <ConfirmButton className="text-xs text-stone-400 hover:text-rose-700" message="Make a new link? The old one stops working, so you'll need to subscribe again with the new one.">
              Shared it by mistake? Make a new link
            </ConfirmButton>
          </form>
        </div>
      </Card>

      <Card title="Show my iCloud calendar on the schedule">
        <ActionForm action={saveMyBusyCalendar} className="space-y-3 text-sm text-stone-600">
          <p>Your own appointments show as grey <b>busy</b> blocks on the CRM schedule so nobody books a job over them. Only you see the event names; everyone else sees “Busy”.</p>
          <ol className="list-decimal space-y-1 pl-5 text-xs text-stone-500">
            <li>On your iPhone, open <b>Calendar</b>, tap <b>Calendars</b> at the bottom, then the <b>ⓘ</b> next to your calendar.</li>
            <li>Turn on <b>Public Calendar</b>, tap <b>Share Link…</b> and <b>Copy</b>.</li>
            <li>Paste it here and save.</li>
          </ol>
          <input className="input" name="busy_calendar_url" defaultValue={busyUrl} placeholder="webcal://p…-caldav.icloud.com/published/2/…" autoComplete="off" />
          <div className="flex flex-wrap items-center justify-end gap-2">
            {busyUrl && (
              <label className="mr-auto flex items-center gap-2 text-xs">
                <input type="checkbox" name="remove" className="h-4 w-4 accent-rose-500" /> Stop showing it
              </label>
            )}
            <SubmitButton pendingText="Checking…">Save</SubmitButton>
          </div>
          <p className="text-xs text-stone-400">Anyone with a public calendar link can see that calendar, so only share one you&apos;re comfortable with (you can make a separate “Busy” calendar for this).</p>
        </ActionForm>
      </Card>

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
