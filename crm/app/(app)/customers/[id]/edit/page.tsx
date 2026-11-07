import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCustomer } from "@/lib/data";
import { customerName } from "@/lib/format";
import { deleteCustomer } from "@/lib/actions";
import { PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/customer-form";
import { ConfirmButton } from "@/components/forms";

export const metadata = { title: "Edit customer" };

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin", "dispatcher"]);
  const c = getCustomer(Number((await params).id));
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${customerName(c)}`} back={{ href: `/customers/${c.id}`, label: customerName(c) }} />
      <CustomerForm customer={c} />
      {user.role === "admin" && (
        <form action={deleteCustomer} className="mt-10 border-t border-stone-200 pt-6">
          <input type="hidden" name="id" value={c.id} />
          <p className="mb-2 text-sm text-stone-500">Deleting a customer also deletes their jobs, estimates, invoices and payments.</p>
          <ConfirmButton message={`Delete ${customerName(c)} and all their records? This can't be undone.`}>Delete customer</ConfirmButton>
        </form>
      )}
    </div>
  );
}
