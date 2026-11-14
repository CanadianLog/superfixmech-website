import { addManualReview, removeManualReview, saveReviewSelection, linkGoogleBusiness, unlinkGoogleBusiness, refreshGoogleReviews, saveAddressSearchKey, saveMessagingSettings, saveReviewSettings, saveWebsiteOrigins, sendTestMessage } from "@/lib/actions";
import { emailConfigured, smsConfigured } from "@/lib/messaging";
import { getGoogleReviews, hiddenReviewIds, manualReviews, searchBusinesses, type PlaceCandidate, type StoredReview } from "@/lib/reviews";
import { ActionForm, ConfirmButton, SubmitButton } from "./forms";
import { Card, Field } from "./ui";

const Pill = ({ on }: { on: boolean }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${on ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>{on ? "Ready" : "Not set up"}</span>
);

export function MessagingCard({ s }: { s: Record<string, string> }) {
  const sms = smsConfigured(s);
  const email = emailConfigured(s);
  return (
    <div id="messaging" className="mt-6 scroll-mt-6">
      <Card title="Texts & email">
        <p className="text-sm text-stone-600">
          Used to send invoices, receipts and Google review requests automatically. Until these are set up, the CRM opens your phone&apos;s own texting or email app with the message already written, so you can still send it with one tap.
        </p>
        <ActionForm action={saveMessagingSettings} className="mt-5 space-y-6">
          <section>
            <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-bold">Texting (Twilio)</h3><Pill on={sms} /></div>
            <p className="mb-3 text-xs text-stone-500">
              Sign up at twilio.com, buy a local 613 number (about US$1–2/month plus roughly a cent per text), then copy the Account SID and Auth Token from the Twilio console.
              Customers who reply STOP are blocked automatically.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Account SID"><input className="input" name="twilio_sid" defaultValue={s.twilio_sid} autoComplete="off" placeholder="AC…" /></Field>
              <Field label="Auth token"><input className="input" type="password" name="twilio_token" autoComplete="off" placeholder={s.twilio_token ? "•••••••• (saved)" : ""} /></Field>
              <Field label="Your Twilio number"><input className="input" name="twilio_from" defaultValue={s.twilio_from} placeholder="+16135551234" /></Field>
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-bold">Email (your mailbox)</h3><Pill on={email} /></div>
            <p className="mb-3 text-xs text-stone-500">
              Gmail / Google Workspace: server <code>smtp.gmail.com</code>, port <code>465</code>, your full email, and an <b>app password</b> (Google Account → Security → 2-Step Verification → App passwords).
              Outlook / Microsoft 365: <code>smtp.office365.com</code>, port <code>587</code>.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="SMTP server"><input className="input" name="smtp_host" defaultValue={s.smtp_host} placeholder="smtp.gmail.com" /></Field>
              <Field label="Port"><input className="input" name="smtp_port" defaultValue={s.smtp_port} inputMode="numeric" /></Field>
              <Field label="Send as name"><input className="input" name="smtp_from_name" defaultValue={s.smtp_from_name} /></Field>
              <Field label="Email address (login)"><input className="input" name="smtp_user" defaultValue={s.smtp_user} placeholder="service@superfixmech.ca" autoComplete="off" /></Field>
              <Field label="Password / app password"><input className="input" type="password" name="smtp_pass" autoComplete="off" placeholder={s.smtp_pass ? "•••••••• (saved)" : ""} /></Field>
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-bold">Copies to you</h3>
            <input type="hidden" name="notify_present" value="1" />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Email me when these go to a customer" hint={`Leave blank to use ${s.company_email || "your company email"}. Needs email set up above.`}>
                <input className="input" type="email" name="notify_email" defaultValue={s.notify_email} placeholder={s.company_email} />
              </Field>
              <div className="flex flex-wrap gap-4 pb-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="notify_invoice" defaultChecked={s.notify_invoice === "1"} className="h-4 w-4 accent-amber-500" /> Invoices</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="notify_receipt" defaultChecked={s.notify_receipt === "1"} className="h-4 w-4 accent-amber-500" /> Receipts</label>
              </div>
            </div>
          </section>
          <div className="flex justify-end"><SubmitButton>Save</SubmitButton></div>
        </ActionForm>

        {(sms || email) && (
          <ActionForm action={sendTestMessage} className="mt-6 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
            <Field label="Send a test">
              <select className="input" name="channel" defaultValue={sms ? "sms" : "email"}>
                {sms && <option value="sms">Text to</option>}
                {email && <option value="email">Email to</option>}
              </select>
            </Field>
            <input className="input max-w-xs" name="to" placeholder="Your mobile # or email" aria-label="Send test to" />
            <SubmitButton className="btn-ghost" pendingText="Sending…">Send test</SubmitButton>
          </ActionForm>
        )}
      </Card>
    </div>
  );
}

export function ReviewCard({ s }: { s: Record<string, string> }) {
  return (
    <div id="reviews" className="mt-6 scroll-mt-6">
      <Card title="Google reviews">
        <ActionForm action={saveReviewSettings} className="space-y-4">
          <Field label="Your Google review link" hint="In Google Business Profile (search “SuperFix Mechanical” on Google while signed in) click “Ask for reviews” and copy the link, e.g. https://g.page/r/…/review">
            <input className="input" name="google_review_url" defaultValue={s.google_review_url} placeholder="https://g.page/r/XXXXXXXX/review" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="review_auto" defaultChecked={s.review_auto === "1"} className="h-4 w-4 accent-amber-500" />
            Automatically ask for a review when a job is marked finished
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Wait before sending (minutes)" hint="Texts are never sent between 8pm and 9am; they wait until morning.">
              <input className="input" name="review_delay_minutes" inputMode="numeric" defaultValue={s.review_delay_minutes} />
            </Field>
            <Field label="Don't ask the same customer again for (days)">
              <input className="input" name="review_cooldown_days" inputMode="numeric" defaultValue={s.review_cooldown_days} />
            </Field>
          </div>
          <details className="rounded-lg bg-stone-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Edit message wording</summary>
            <p className="mt-2 text-xs text-stone-500">
              You can use {"{first_name}"}, {"{company}"}, {"{phone}"}, {"{review_link}"}, and on invoices/receipts {"{amount}"}, {"{invoice_number}"}, {"{method}"}, {"{link}"}.
            </p>
            <div className="mt-3 grid gap-3">
              <Field label="Review request – text"><textarea className="input" name="tpl_review_sms" defaultValue={s.tpl_review_sms} /></Field>
              <Field label="Review request – email"><textarea className="input min-h-32" name="tpl_review_email" defaultValue={s.tpl_review_email} /></Field>
              <Field label="Invoice – text"><textarea className="input" name="tpl_invoice_sms" defaultValue={s.tpl_invoice_sms} /></Field>
              <Field label="Invoice – email"><textarea className="input min-h-32" name="tpl_invoice_email" defaultValue={s.tpl_invoice_email} /></Field>
              <Field label="Receipt – text"><textarea className="input" name="tpl_receipt_sms" defaultValue={s.tpl_receipt_sms} /></Field>
              <Field label="Receipt – email"><textarea className="input min-h-32" name="tpl_receipt_email" defaultValue={s.tpl_receipt_email} /></Field>
            </div>
          </details>
          <div className="flex justify-end"><SubmitButton>Save</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}

export function AddressSearchCard({ s, fromEnv }: { s: Record<string, string>; fromEnv: boolean }) {
  const on = fromEnv || !!s.google_maps_api_key;
  return (
    <div id="address-search" className="mt-6 scroll-mt-6">
      <Card title="Google address search" actions={<Pill on={on} />}>
        <p className="text-sm text-stone-600">
          Suggests real addresses as you type on customer and address forms, and fills in the street, city, province and postal code.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-stone-500">
          <li>Go to console.cloud.google.com, create a project and add a billing account (Google includes a free monthly allowance that a small business is unlikely to go over).</li>
          <li>Under <b>APIs &amp; Services → Library</b>, enable <b>Places API (New)</b>.</li>
          <li>Under <b>APIs &amp; Services → Credentials</b>, create an <b>API key</b>, restrict it to <b>Places API (New)</b>, and paste it below.</li>
        </ol>
        {fromEnv ? (
          <p className="mt-3 text-sm text-stone-500">The key is set on the server (GOOGLE_MAPS_API_KEY).</p>
        ) : (
          <ActionForm action={saveAddressSearchKey} className="mt-4 flex flex-wrap items-end gap-2">
            <Field label="API key" className="min-w-64 flex-1">
              <input className="input" type="password" name="google_maps_api_key" autoComplete="off" placeholder={s.google_maps_api_key ? "•••••••• (saved)" : "AIza…"} />
            </Field>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        )}
      </Card>
    </div>
  );
}

export async function WebsiteCard({ s, origin, placeQuery }: { s: Record<string, string>; origin: string; placeQuery?: string }) {
  let cached: { name?: string; rating?: number | null; count?: number } = {};
  try {
    cached = s.reviews_cache ? JSON.parse(s.reviews_cache) : {};
  } catch {
    cached = {};
  }
  const linked = s.google_place_confirmed === "1" && !!s.google_place_id;
  const hasKey = !!(process.env.GOOGLE_MAPS_API_KEY || s.google_maps_api_key);
  const google = linked ? await getGoogleReviews().catch(() => null) : null;
  const manual = manualReviews();
  const hidden = new Set(hiddenReviewIds());
  const minRating = Number(s.reviews_min_rating || "4");
  let results: PlaceCandidate[] = [];
  let searchError = "";
  if (placeQuery && hasKey) {
    try {
      results = await searchBusinesses(placeQuery);
    } catch (e) {
      searchError = (e as Error).message;
    }
  }
  return (
    <div id="website" className="mt-6 scroll-mt-6">
      <Card title="Your website">
        <p className="text-sm text-stone-600">
          The booking form on your website sends requests straight into the CRM as unscheduled jobs tagged “Online booking”, and the reviews section shows your Google
          rating and reviews. Both come from <code className="text-xs">{origin}</code>.
        </p>
        <ActionForm action={saveWebsiteOrigins} className="mt-4 flex flex-wrap items-end gap-2">
          <Field label="Website addresses allowed to send bookings" className="min-w-72 flex-1" hint="Comma separated. Bookings from anywhere else need the booking key below.">
            <input className="input" name="website_origins" defaultValue={s.website_origins} />
          </Field>
          <SubmitButton className="btn-ghost">Save</SubmitButton>
        </ActionForm>

        <div className="mt-6 border-t border-stone-100 pt-4">
          <h3 className="text-sm font-bold">Google reviews on your website</h3>
          <p className="mt-1 text-xs text-stone-500">
            Uses the same Google API key as address search. Google shares up to 5 recent reviews; the website shows the 4★ and 5★ ones plus your overall rating, refreshed twice a day.
          </p>

          {linked ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <span>
                Showing reviews for <b>{cached.name || "your business"}</b>
                {cached.rating ? ` · ${cached.rating}★ from ${cached.count} reviews` : ""}
              </span>
              <form action={unlinkGoogleBusiness}>
                <button className="text-xs underline">Unlink</button>
              </form>
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">No business chosen yet, so your website shows a “Read our Google reviews” button instead of reviews.</p>
          )}

          {!hasKey ? (
            <p className="mt-3 text-sm text-stone-500">Add your Google API key under “Google address search” first.</p>
          ) : (
            <form method="get" action="/settings#website" className="mt-3 flex flex-wrap items-end gap-2">
              <Field label="Search Google for your business" className="min-w-72 flex-1">
                <input className="input" name="place_q" defaultValue={placeQuery || "Super Fix Mechanical Ottawa"} />
              </Field>
              <button className="btn-dark">Search</button>
            </form>
          )}

          {searchError && <p className="mt-3 text-sm text-rose-700">{searchError}</p>}
          {placeQuery && hasKey && !searchError && (
            <ul className="mt-3 divide-y divide-stone-100 rounded-lg border border-stone-200">
              {results.length === 0 && <li className="px-3 py-3 text-sm text-stone-500">No businesses found. Try the exact name on your Google listing.</li>}
              {[...results].sort((a, b) => Number(b.isYours) - Number(a.isYours)).map((r) => (
                <li key={r.id} className={`flex flex-wrap items-center justify-between gap-3 px-3 py-3 ${r.isYours ? "bg-emerald-50" : ""}`}>
                  <div className="min-w-0 text-sm">
                    <div className="font-semibold">
                      {r.name} {r.isYours && <span className="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Matches your website&apos;s map</span>}
                    </div>
                    <div className="text-xs text-stone-500">
                      {r.address}
                      {r.rating ? ` · ${r.rating}★ (${r.count})` : ""}
                      {r.mapsUri && (
                        <>
                          {" · "}
                          <a href={r.mapsUri} target="_blank" rel="noreferrer" className="link">View on Google Maps</a>
                        </>
                      )}
                    </div>
                  </div>
                  <ActionForm action={linkGoogleBusiness}>
                    <input type="hidden" name="place_id" value={r.id} />
                    <SubmitButton className={r.isYours ? "btn-primary btn-sm" : "btn-ghost btn-sm"} pendingText="Linking…">This is my business</SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}

          {linked && (
            <ActionForm action={refreshGoogleReviews} className="mt-3">
              <SubmitButton className="btn-ghost btn-sm" pendingText="Refreshing…">Refresh reviews now</SubmitButton>
            </ActionForm>
          )}
        </div>

        <div id="reviews-shown" className="mt-6 scroll-mt-6 border-t border-stone-100 pt-4">
          <h3 className="text-sm font-bold">Choose which reviews your website shows</h3>
          <p className="mt-1 text-xs text-stone-500">
            Google only shares up to 5 reviews (the ones it picks as most relevant). Untick any you don&apos;t want shown. To feature a different review, copy it from your Google listing into
            “Add a review” below.
          </p>
          {manual.length + (google?.reviews.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-stone-400">{linked ? "Google hasn't shared any reviews yet." : "Choose your Google business above, or add a review below."}</p>
          ) : (
            <ActionForm action={saveReviewSelection} className="mt-3 space-y-3">
              <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
                {[...manual, ...(google?.reviews ?? [])].map((r: StoredReview) => {
                  const lowRated = r.source === "google" && r.rating < minRating;
                  return (
                    <li key={r.id} className={`flex gap-3 px-3 py-3 text-sm ${lowRated ? "opacity-50" : ""}`}>
                      <input type="checkbox" name="show" value={r.id} defaultChecked={!hidden.has(r.id)} className="mt-1 h-4 w-4 shrink-0 accent-amber-500" aria-label={`Show ${r.author}'s review`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <b>{r.author}</b>
                          <span className="text-amber-500">{"★".repeat(r.rating)}<span className="text-stone-300">{"★".repeat(5 - r.rating)}</span></span>
                          <span className="text-xs text-stone-400">{r.when}</span>
                          <span className={`rounded-full px-1.5 text-[10px] font-semibold ${r.source === "manual" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>
                            {r.source === "manual" ? "Added by you" : "From Google"}
                          </span>
                          {lowRated && <span className="text-[10px] text-stone-500">(below your minimum stars)</span>}
                        </div>
                        <p className="mt-1 line-clamp-3 text-stone-600">{r.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Field label="Only show Google reviews with at least">
                  <select name="reviews_min_rating" defaultValue={String(minRating)} className="input w-auto">
                    {[5, 4, 3, 1].map((n) => <option key={n} value={n}>{n === 1 ? "Any rating" : `${n} stars`}</option>)}
                  </select>
                </Field>
                <SubmitButton>Save selection</SubmitButton>
              </div>
            </ActionForm>
          )}

          {manual.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {manual.map((r) => (
                <form key={r.id} action={removeManualReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton className="rounded-full border border-stone-200 px-2 py-1 text-stone-500 hover:border-rose-300 hover:text-rose-700" message={`Remove ${r.author}'s review from your website?`}>
                    Remove {r.author}&apos;s review ✕
                  </ConfirmButton>
                </form>
              ))}
            </div>
          )}

          <details className="mt-4 rounded-lg bg-stone-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold">+ Add a review</summary>
            <ActionForm action={addManualReview} className="mt-3 grid gap-3 sm:grid-cols-4">
              <Field label="Reviewer's name" className="sm:col-span-2"><input className="input" name="author" placeholder="e.g. Sarah M." required /></Field>
              <Field label="Stars">
                <select name="rating" className="input" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
              </Field>
              <Field label="When (optional)"><input className="input" name="when" placeholder="e.g. March 2026" /></Field>
              <Field label="What they wrote" className="sm:col-span-4"><textarea className="input" name="text" required placeholder="Paste the review text exactly as it appears on Google" /></Field>
              <p className="text-xs text-stone-500 sm:col-span-3">Only add real reviews, word for word, from your Google listing.</p>
              <div className="flex justify-end"><SubmitButton className="btn-dark">Add review</SubmitButton></div>
            </ActionForm>
          </details>
        </div>
      </Card>
    </div>
  );
}
