import type { Metadata } from "next";
import { PolicyContent } from "@/components/sections/policy-content";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions | SuperFix Mechanical",
  description:
    "Terms and conditions for SMS messaging communications from SuperFix Mechanical Inc.",
};

export default function TermsPage() {
  return (
    <main>
      <PolicyContent
        title="SMS Terms & Conditions"
        intro="Effective Date: January 1st, 2026. By opting in to receive SMS messages from SuperFix Mechanical Inc., you agree to the following Terms & Conditions."
        sections={[
          {
            heading: "SMS Messaging Service",
            points: [
              "By providing your phone number, you consent to receive SMS messages from SuperFix Mechanical Inc., including appointment confirmations and reminders.",
              "You may receive service updates and technician notifications.",
              "You may receive customer support communications.",
              "You may receive billing and invoice notifications.",
            ],
          },
          {
            heading: "Message Frequency",
            points: [
              "Message frequency may vary depending on your service requests and interactions with us.",
            ],
          },
          {
            heading: "Message & Data Rates",
            points: [
              "Standard message and data rates may apply depending on your mobile carrier and plan.",
            ],
          },
          {
            heading: "Opt-In",
            points: [
              "You may opt in to receive SMS messages by submitting a form on our website.",
              "You may opt in by requesting service.",
              "You may opt in by providing verbal or written consent.",
            ],
          },
          {
            heading: "Opt-Out",
            points: [
              "You can opt out at any time by replying STOP to any message.",
              "After opting out, you will no longer receive SMS communications unless you opt in again.",
            ],
          },
          {
            heading: "Help & Support",
            points: [
              "For assistance, reply HELP or contact 613-366-7009.",
              "Email: service@superfixmech.ca.",
            ],
          },
          {
            heading: "Privacy",
            points: [
              "Your information will be handled in accordance with our Privacy Policy.",
              "We do not sell or share your personal information or SMS consent with third parties for marketing purposes.",
            ],
          },
          {
            heading: "Changes to Terms",
            points: [
              "We may update these Terms & Conditions at any time.",
              "Continued use of our SMS service constitutes acceptance of any changes.",
            ],
          },
        ]}
      />
    </main>
  );
}
