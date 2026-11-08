# SuperFix CRM

A field-service CRM for SuperFix Mechanical: customers, jobs, dispatch, estimates, invoices, payments, a parts catalogue and a QuickBooks Online connection. It's a separate app from the marketing website in the folder above.

## What's in it

| Area | What you can do |
| --- | --- |
| **Dashboard** | Today's jobs, unscheduled work, open estimates, unpaid invoices, money collected this month, recent activity. |
| **Schedule** | Week and day (per-technician) views, filter by tech, schedule unscheduled jobs from the side panel. |
| **Jobs** | Appliance type, brand, model # and serial #; arrival window; assigned tech; line items; notes timeline; "On my way → Start → Finish" status buttons; one click to invoice. |
| **Customers** | Contact info, multiple service addresses (with map links), tags, lead source, job/estimate/invoice history, balance owing, notes. |
| **Estimates** | Line items from the catalogue, a customer link where the customer approves or declines online with a typed signature, convert to a job. |
| **Invoices** | Created from jobs, **13% HST / 5% GST / no tax** per invoice, partial payments (card, cash, cheque, e-transfer…), overdue tracking, a printable customer link. |
| **Parts catalogue** | Parts and services grouped by appliance type, with **your cost**, **customer price** and profit. When you add items to a job, the job's appliance type is listed first. |
| **QuickBooks Online** | Sends customers, invoices and payments to QuickBooks. Set it up under Settings → QuickBooks Online. |
| **Reports** | Collected vs invoiced, average ticket, revenue by tech, lead sources, payment methods, a 12-month chart. |
| **Team** | Admin / dispatcher / technician roles. Technicians see only their own jobs. |
| **Website bookings** | `POST /api/public/booking` creates (or matches) a customer and an unscheduled job. See Settings for the key and an example. |

## Run it locally

Needs **Node.js 22.5 or newer** (it uses Node's built-in SQLite, so there's no separate database to install).

```bash
cd crm
npm install
npm run dev
```

Open http://localhost:3100. The first visit asks you to create the owner account. To look around, use **Load sample data** on the dashboard.

## Finishing a job, invoices, receipts and Google reviews

- On a job, tap **✓ Job finished**. The job is marked complete, an invoice is created from its line items, and a **Checkout** panel opens:
  1. **Send invoice** by text and/or email.
  2. **Payment & receipt**: pick how they paid (e-Transfer, credit card, cash or cheque), then the receipt is sent by text and/or email. Each payment has its own receipt page.
  3. **Google review request**: sent automatically after the job is finished (default: 60 minutes later, never between 8pm and 9am). You can send it right away or cancel it from the job.
- Set up sending under **Settings → Texts & email** (Twilio for texts, your mailbox such as Gmail for email) and **Settings → Google reviews** (paste your Google review link). Until texting or email is set up, the buttons open your phone's own texting or email app with the message already written.
- Customers who shouldn't get review requests can be marked on their customer page. Customers who reply STOP to a text are blocked by Twilio.

## Bring your data over from Housecall Pro

Sign in as an admin and open **Settings → Import from Housecall Pro** (or go to `/import`). That page walks through each step:

1. In Housecall Pro: **Customers → Actions → Export**, then **Jobs → Actions → Export**. Each CSV arrives by email. Optionally, also export the **Price book**.
2. Add your technicians on the **Team** page, using the same names they had in Housecall Pro.
3. Upload the CSV files. Customers are matched so nobody is duplicated, and importing the same file twice is safe. Completed jobs come over with an invoice and their recorded payment, so balances carry over.

Excel (.xlsx) files need to be saved as CSV first.

## Hosting on Render (easiest)

The repository has a `render.yaml` blueprint. On https://render.com choose **New → Blueprint** and pick this repository. It creates the CRM web service with a 1 GB persistent disk for the database. The marketing website is not affected. Once it's live, open the address Render gives you to create the owner account. To use your own address (e.g. `crm.superfixmech.ca`), add it under the service's **Custom Domains** in Render.

## Run it for real

The app is a normal Node server with a single database file. Any host that runs Node and keeps a **persistent disk** works: a small VPS, Render or Railway with a volume, Fly.io with a volume, or a computer in the office.

```bash
cd crm
npm ci
npm run build
CRM_DB_PATH=/var/data/crm.db CRM_PUBLIC_URL=https://crm.superfixmech.ca PORT=3100 npm start
```

| Variable | Purpose |
| --- | --- |
| `CRM_DB_PATH` | Where the SQLite database file lives. Default: `crm/data/crm.db`. **Back this file up** (copy it nightly). |
| `CRM_PUBLIC_URL` | The public address of the CRM. Used in links sent to customers and in the QuickBooks redirect. |
| `PORT` | Port to listen on (default 3100). |
| `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_ENV` | Optional. QuickBooks app keys, instead of entering them in Settings. `QBO_ENV` is `production` or `sandbox`. |
| `CRM_BOOKING_ORIGIN` | Optional. Restricts which website can call the booking API (for example `https://superfixmech.ca`). |
| `CRM_INSECURE_COOKIES=1` | Only for testing over plain `http://` on a non-localhost address. |

Serverless hosts with no disk (Vercel, Netlify) won't keep the database between requests. Use a host with a disk.

## Connecting QuickBooks Online

1. Sign in at https://developer.intuit.com with your QuickBooks login and create an app (QuickBooks Online and Payments, **Accounting** scope).
2. Under **Keys & credentials → Production**, add the Redirect URI shown in **Settings → QuickBooks Online** (it's `https://<your CRM address>/api/qbo/callback`). Intuit requires HTTPS for production.
3. Paste the Client ID and Client Secret into Settings, save, then click **Connect to QuickBooks**.
4. Choose the QuickBooks product/service that line items post to (usually "Services"), and match **HST 13%**, **GST 5%** and **No tax** to your QuickBooks tax codes.
5. On any invoice, click **Send to QuickBooks**, or use **Send unsynced invoices** in Settings. After an invoice is in QuickBooks, payments you record on it are sent automatically. Voiding it in the CRM voids it in QuickBooks.

QuickBooks connections expire if unused for about 100 days. If that happens, click Connect again.

## Backups

All data is in the one database file at `CRM_DB_PATH`, plus `-wal` and `-shm` files next to it while the server is running. To back up safely while it runs:

```bash
sqlite3 /var/data/crm.db ".backup '/backups/crm-$(date +%F).db'"
```
