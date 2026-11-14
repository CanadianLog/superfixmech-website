import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { customerAddresses, getCustomer, getJob, lineItems, listPricebook, listSuppliers, listTechs, taxRate } from "@/lib/data";
import { deleteJob } from "@/lib/actions";
import { PageHeader } from "@/components/ui";
import { JobForm } from "@/components/job-form";
import { ConfirmButton } from "@/components/forms";

export const metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin", "dispatcher"]);
  const job = getJob(Number((await params).id));
  if (!job) notFound();
  const customer = getCustomer(job.customer_id)!;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={`Edit job #${job.number}`} back={{ href: `/jobs/${job.id}`, label: `Job #${job.number}` }} />
      <JobForm
        job={job}
        customer={customer}
        addresses={customerAddresses(customer.id)}
        techs={listTechs()}
        pricebook={listPricebook()}
        suppliers={listSuppliers()}
        taxRate={taxRate()}
        items={lineItems("job", job.id).map((i) => ({ ...i, taxable: !!i.taxable }))}
      />
      {user.role === "admin" && (
        <form action={deleteJob} className="mt-10 border-t border-stone-200 pt-6">
          <input type="hidden" name="id" value={job.id} />
          <ConfirmButton message={`Delete job #${job.number}? Invoices for it are kept.`}>Delete job</ConfirmButton>
        </form>
      )}
    </div>
  );
}
