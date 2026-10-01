import Script from "next/script";

const HCP_TOKEN = "782f6b3219464d26a0b49b809ad17b06";
const HCP_ORG = "Super-Fix-Mechanical";

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
      <iframe
        id="hcp-lead-iframe"
        title="Request an appointment with SuperFix Mechanical"
        src={`https://book.housecallpro.com/lead-form/${HCP_ORG}/${HCP_TOKEN}`}
        className="w-full rounded-xl border-0"
        style={{ height: 820 }}
      />
    </div>
  );
}
