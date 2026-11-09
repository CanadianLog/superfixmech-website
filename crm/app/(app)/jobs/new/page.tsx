import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { customerAddresses, getCustomer, listPricebook, listTechs, taxRate } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { JobForm } from "@/components/job-form";
import { CustomerChooser } from "@/components/customer-chooser";

export const metadata = { title: "New job" };

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ customer?: string; q?: string; date?: string }> }) {
  await requireUser(["admin", "dispatcher"]);
  const sp = await searchParams;
  if (!sp.customer) {
    return (
      <>
        <PageHeader title="New job" subtitle="Who is this job for?" back={{ href: "/jobs", label: "Jobs" }} />
        <CustomerChooser q={sp.q ?? ""} basePath="/jobs/new" />
      </>
    );
  }
  const customer = getCustomer(Number(sp.customer));
  if (!customer) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="New job" back={{ href: `/customers/${customer.id}`, label: "Back" }} />
      <JobForm
        customer={customer}
        addresses={customerAddresses(customer.id)}
        techs={listTechs()}
        pricebook={listPricebook()}
        taxRate={taxRate()}
        defaultDate={sp.date}
      />
    </div>
  );
}
