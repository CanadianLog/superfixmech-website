import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ProspectForm } from "@/components/prospect-form";

export const metadata = { title: "Add property manager" };

export default async function NewProspectPage() {
  await requireUser(["admin", "dispatcher"]);
  return (
    <>
      <PageHeader title="Add property manager" back={{ href: "/prospects", label: "Cold calls" }} />
      <Card className="max-w-3xl">
        <ProspectForm cancelHref="/prospects" />
      </Card>
    </>
  );
}
