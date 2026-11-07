import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/customer-form";

export const metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  await requireUser(["admin", "dispatcher"]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New customer" back={{ href: "/customers", label: "Customers" }} />
      <CustomerForm />
    </div>
  );
}
