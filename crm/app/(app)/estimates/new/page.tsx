import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { customerAddresses, getCustomer, listPricebook, taxRate } from "@/lib/data";
import { customerName } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { CustomerChooser } from "@/components/customer-chooser";
import { EstimateForm } from "@/components/estimate-form";

export const metadata = { title: "New estimate" };

export default async function NewEstimatePage({ searchParams }: { searchParams: Promise<{ customer?: string; q?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const sp = await searchParams;
  if (!sp.customer) {
    return (
      <>
        <PageHeader title="New estimate" subtitle="Who is this estimate for?" back={{ href: "/estimates", label: "Estimates" }} />
        <CustomerChooser q={sp.q ?? ""} basePath="/estimates/new" />
      </>
    );
  }
  const c = getCustomer(Number(sp.customer));
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="New estimate" subtitle={customerName(c)} back={{ href: `/customers/${c.id}`, label: customerName(c) }} />
      <EstimateForm customerId={c.id} addresses={customerAddresses(c.id)} pricebook={listPricebook()} taxRate={taxRate()} />
    </div>
  );
}
