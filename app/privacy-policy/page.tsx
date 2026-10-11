import type { Metadata } from "next";
import { PolicyContent } from "@/components/sections/policy-content";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Privacy Policy | SuperFix Mechanical",
  description:
    "How SuperFix Mechanical Inc. collects, uses, and protects your information on our website and through SMS messaging.",
};

export default function PrivacyPolicyPage() {
  return (
    <main>
      <PolicyContent
        title="Privacy Policy"
        intro="Effective Date: January 1st, 2026. Last updated: October 11, 2026. SuperFix Mechanical Inc. (we, us, our) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect and use information when you use our website, request service, or opt in to receive SMS (text) messages from us related to our appliance repair services across Ottawa."
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
            heading: "Information Collected Through Our Website",
            points: [
              "Booking and contact form submissions (such as your name, phone number, address, and service details) are processed by Housecall Pro, our scheduling provider, so we can respond to your request.",
              "If you use the live chat, your messages are handled by our chat provider (Tawk.to).",
              "Our hosting provider (Cloudflare) processes basic technical data, such as IP address and browser type, to deliver and secure the website.",
            ],
          },
          {
            heading: "Cookies and Analytics",
            points: [
              "With your consent, we use Google Analytics to understand how visitors use our website. It uses cookies and collects information such as pages viewed, approximate location, and device type.",
              "Analytics cookies are only set if you click Accept on our cookie banner. You can change your choice at any time using the Cookie Settings link in the website footer.",
              "The website works the same whether you accept or decline analytics cookies.",
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
            heading: "Your Choices and Rights",
            points: [
              "You may request access to, or correction of, the personal information we hold about you.",
              "You may withdraw your consent to SMS messages, analytics cookies, or other uses at any time, subject to legal or contractual limits.",
              "To make a request, email service@superfixmech.ca.",
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
