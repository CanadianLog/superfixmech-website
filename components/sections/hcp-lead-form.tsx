import Script from "next/script";
import { HCP_ORG, HCP_TOKEN, HcpFormFrame } from "@/components/sections/hcp-form-frame";

/**
 * Housecall Pro lead capture form. Submissions land in Housecall Pro as leads.
 * The script handles HCP's own behaviour (e.g. resizing); the iframe works on its own.
 */
export function HcpLeadForm() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Script
        id="hcp-lead-script"
        src={`https://online-booking.housecallpro.com/script.js?token=${HCP_TOKEN}&orgName=${HCP_ORG}`}
        strategy="afterInteractive"
      />
      <HcpFormFrame id="hcp-lead-iframe" className="rounded-xl" />
    </div>
  );
}
