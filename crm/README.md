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
