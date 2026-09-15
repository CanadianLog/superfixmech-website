import type { Metadata } from "next";
import { PolicyContent } from "@/components/sections/policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | SuperFix Mechanical",
  description:
    "How SuperFix Mechanical Inc. collects, uses, and protects your information, including SMS messaging consent.",
};

export default function PrivacyPolicyPage() {
  return (
    <main>
      <PolicyContent
        title="Privacy Policy for SMS Messaging"
        intro="Effective Date: January 1st, 2026. SuperFix Mechanical Inc. (we, us, our) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect and use information when you opt in to receive SMS (text) messages from us related to our appliance repair services across Ottawa."
        sections={[
          {
            heading: "Information We Collect",
            points: [
              "Your phone number.",
              "Your consent to receive SMS messages.",
              "Your name and basic contact details.",
              "Service address (if provided).",
              "Email address (if provided).",
            ],
          },
          {
            heading: "How We Collect Your Information",
            points: [
              "When you contact us directly (phone, website, or in person).",
              "When you request a service or quote.",
              "When you opt in to receive SMS updates.",
              "Through our website or booking systems.",
              "From third-party platforms (for example, referrals or service marketplaces).",
            ],
          },
          {
            heading: "How We Use Information",
            points: [
              "Send appointment confirmations and reminders.",
              "Provide service updates and technician arrival notifications.",
              "Respond to inquiries and support requests.",
              "Send invoices, receipts, and service-related communications.",
              "Operate and improve our services.",
              "Message frequency may vary. Message and data rates may apply.",
              "We do not send spam or unrelated marketing messages.",
            ],
          },
          {
            heading: "Opt-Out Instructions",
            points: [
              "You can opt out at any time by replying STOP to any message.",
              "After opting out, you will no longer receive SMS messages unless you opt in again.",
              "For help, reply HELP or contact us below.",
            ],
          },
          {
            heading: "Disclosure of Your Information",
            points: [
              "We may share your information only when necessary with service providers (for example, scheduling or SMS platforms).",
              "We may share your information with technicians or contractors performing services.",
              "We may disclose information to legal authorities if required by law.",
              "We do not sell your personal information.",
              "We do not share your phone number for marketing purposes.",
              "We do not share SMS consent with third parties or affiliates.",
            ],
          },
          {
            heading: "Protection of Your Information",
            points: [
              "We take reasonable safeguards to protect your personal information from unauthorized access or disclosure.",
            ],
          },
          {
            heading: "Policy Updates",
            points: [
              "We may update this Privacy Policy periodically. Updates will be posted or communicated where required.",
            ],
          },
          {
            heading: "Contact Us",
            points: [
              "SuperFix Mechanical Inc.",
              "Text HELP to: 613-366-7009.",
              "Email: service@superfixmech.ca.",
              "Phone: 613-366-7009.",
            ],
          },
        ]}
      />
    </main>
  );
}
