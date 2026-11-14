export type Role = "admin" | "dispatcher" | "tech";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  color: string;
  active: number;
  created_at: string;
};

export type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string;
  alt_phone: string;
  tags: string;
  lead_source: string;
  notes: string;
  qbo_id: string | null;
  no_review: number;
  created_at: string;
};

export type Address = {
  id: number;
  customer_id: number;
  street: string;
  unit: string;
  city: string;
  province: string;
  postal_code: string;
  notes: string;
};

export const JOB_STATUSES = [
  "unscheduled",
  "scheduled",
  "dispatched",
  "in_progress",
  "completed",
  "canceled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type Job = {
  id: number;
  number: number;
  customer_id: number;
  address_id: number | null;
  title: string;
  description: string;
  status: JobStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  tech_id: number | null;
  appliance: string;
  brand: string;
  model: string;
  serial: string;
  private_notes: string;
  lead_source: string;
  estimate_id: number | null;
  tax_rate: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export const ESTIMATE_STATUSES = ["draft", "sent", "approved", "declined", "converted"] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export type Estimate = {
  id: number;
  number: number;
  customer_id: number;
  address_id: number | null;
  title: string;
  message: string;
  status: EstimateStatus;
  token: string;
  valid_until: string | null;
  job_id: number | null;
  responded_at: string | null;
  tax_rate: number | null;
  created_at: string;
};

export type Invoice = {
  id: number;
  number: number;
  customer_id: number;
  job_id: number | null;
  status: "draft" | "sent" | "void";
  token: string;
  issued_on: string;
  due_on: string;
  notes: string;
  tax_rate: number | null;
  qbo_id: string | null;
  qbo_synced_at: string | null;
  created_at: string;
};

/** Status shown to people, derived from the stored status, payments and due date. */
export type InvoiceDisplayStatus = "draft" | "open" | "partial" | "paid" | "overdue" | "void";

export type Payment = {
  id: number;
  invoice_id: number;
  amount_cents: number;
  method: string;
  reference: string;
  paid_on: string;
  recorded_by: number | null;
  token: string | null;
  created_at: string;
};

export type LineItemKind = "service" | "material" | "discount";

export type LineItem = {
  id: number;
  parent_type: "job" | "estimate" | "invoice";
  parent_id: number;
  kind: LineItemKind;
  name: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  taxable: number;
  sort: number;
  cost_cents: number;
};

/** Shape exchanged with the line-item editor (client component). */
export type LineItemInput = {
  kind: LineItemKind;
  name: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  taxable: boolean;
  /** Your cost per unit (internal only). */
  cost_cents?: number;
};

export type PricebookItem = {
  id: number;
  kind: "service" | "material";
  appliance: string;
  category: string;
  name: string;
  description: string;
  unit_price_cents: number;
  cost_cents: number;
  taxable: number;
  active: number;
};

export type Activity = {
  id: number;
  customer_id: number | null;
  job_id: number | null;
  user_id: number | null;
  kind: string;
  body: string;
  created_at: string;
  user_name?: string | null;
};

export type Totals = { subtotal: number; tax: number; total: number };
