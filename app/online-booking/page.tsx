import type { Metadata } from "next";
import { CrmFormWidget } from "@/components/sections/crm-form-widget";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Book a Service Appointment | SuperFix Mechanical",
  description:
    "Book appliance repair service in Ottawa online. Tell us about your issue and we'll confirm a time — fast, same-day appointments available.",
};

const DESKTOP_FORM_DATA =
  "eyJiYWNrZ3JvdW5kQ29sb3IiOiIjZmZmZGY2IiwiYmFzZVVSTCI6Imh0dHBzOi8vZm9ybXMtcHJvZC5hcGlnYXRld2F5LmNvIiwiYm9yZGVyQ29sb3IiOiIjZjVlN2MyIiwiYm9yZGVyUmFkaXVzIjoiMTJweCIsImJvcmRlclN0eWxlIjoic29saWQiLCJib3JkZXJXaWR0aCI6IjFweCIsImZvcm1JZCI6IkZvcm1Db25maWdJRC1kYjg3MzQ3ZS04MDc5LTQ1NGMtOTQ4ZS1kNTRlODg3ZDU5YzYiLCJwYWRkaW5nIjoiMjBweCIsInByaW1hcnlDb2xvciI6IiNmNWMxMGEiLCJwcmltYXJ5Rm9udENvbG9yIjoiIzViNWI1YiIsIndpZHRoIjoiOTAwcHgifQ==";

const MOBILE_FORM_DATA =
  "eyJiYWNrZ3JvdW5kQ29sb3IiOiIjZmZmZmZmIiwiYmFzZVVSTCI6Imh0dHBzOi8vZm9ybXMtcHJvZC5hcGlnYXRld2F5LmNvIiwiYm9yZGVyQ29sb3IiOiIjZmZkNzAwIiwiYm9yZGVyUmFkaXVzIjoiOHB4IiwiYm9yZGVyU3R5bGUiOiJzb2xpZCIsImJvcmRlcldpZHRoIjoiMXB4IiwiZm9ybUlkIjoiRm9ybUNvbmZpZ0lELTQyYWUyNTRiLWNjOGEtNDZiMS05MjdiLTFkMmZiZDgyZTk4OSIsInBhZGRpbmciOiIyNHB4IiwicHJpbWFyeUNvbG9yIjoiI2ZmZDcwMCIsInByaW1hcnlGb250Q29sb3IiOiIjMzMzMzMzIiwid2lkdGgiOiIzMDBweCJ9";

export default function OnlineBookingPage() {
  return (
    <main>
      <PageHero
        title="Book a Service Appointment"
        subtitle="Tell us about your appliance issue and we'll get back to you to confirm a time."
      />
      <Section innerClassName="max-w-5xl">
        <CrmFormWidget desktopData={DESKTOP_FORM_DATA} mobileData={MOBILE_FORM_DATA} />
      </Section>
    </main>
  );
}
