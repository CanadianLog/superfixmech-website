import type { Metadata } from "next";
import { CrmFormWidget } from "@/components/sections/crm-form-widget";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Contact Us | SuperFix Mechanical",
  description:
    "Get in touch with SuperFix Mechanical for appliance repair in Ottawa. Call 613-366-7009 or send us a message and we'll get back to you.",
};

const DESKTOP_FORM_DATA =
  "eyJiYWNrZ3JvdW5kQ29sb3IiOiIjZmZmZGY2IiwiYmFzZVVSTCI6Imh0dHBzOi8vZm9ybXMtcHJvZC5hcGlnYXRld2F5LmNvIiwiYm9yZGVyQ29sb3IiOiIjZjVlN2MyIiwiYm9yZGVyUmFkaXVzIjoiMTJweCIsImJvcmRlclN0eWxlIjoic29saWQiLCJib3JkZXJXaWR0aCI6IjFweCIsImZvcm1JZCI6IkZvcm1Db25maWdJRC1kYjg3MzQ3ZS04MDc5LTQ1NGMtOTQ4ZS1kNTRlODg3ZDU5YzYiLCJwYWRkaW5nIjoiMjBweCIsInByaW1hcnlDb2xvciI6IiNmNWMxMGEiLCJwcmltYXJ5Rm9udENvbG9yIjoiIzViNWI1YiIsIndpZHRoIjoiOTAwcHgifQ==";

const MOBILE_FORM_DATA =
  "eyJiYWNrZ3JvdW5kQ29sb3IiOiIjZmZmZmZmIiwiYmFzZVVSTCI6Imh0dHBzOi8vZm9ybXMtcHJvZC5hcGlnYXRld2F5LmNvIiwiYm9yZGVyQ29sb3IiOiIjZmZkNzAwIiwiYm9yZGVyUmFkaXVzIjoiOHB4IiwiYm9yZGVyU3R5bGUiOiJzb2xpZCIsImJvcmRlcldpZHRoIjoiMXB4IiwiZm9ybUlkIjoiRm9ybUNvbmZpZ0lELTQyYWUyNTRiLWNjOGEtNDZiMS05MjdiLTFkMmZiZDgyZTk4OSIsInBhZGRpbmciOiIyNHB4IiwicHJpbWFyeUNvbG9yIjoiI2ZmZDcwMCIsInByaW1hcnlGb250Q29sb3IiOiIjMzMzMzMzIiwid2lkdGgiOiIzMDBweCJ9";

export default function ContactPage() {
  return (
    <main>
      <PageHero
        title="Contact Us"
        subtitle="We're here to help. Send a message and we will get back to you."
      />
      <Section innerClassName="max-w-4xl">
        <CrmFormWidget desktopData={DESKTOP_FORM_DATA} mobileData={MOBILE_FORM_DATA} />
      </Section>
    </main>
  );
}
