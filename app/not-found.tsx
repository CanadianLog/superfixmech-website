import Link from "next/link";
import { Section } from "@/components/ui/section";

export default function NotFound() {
  return (
    <Section className="py-24 text-center">
      <h1 className="text-5xl font-extrabold text-[#3b2b0f]">Page Not Found</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm text-[#7e6b45]">
        The page you requested does not exist in this clean-room recreation.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex rounded-full bg-[#7a5d1f] px-6 py-3 text-sm font-semibold text-white"
      >
        Back to Home
      </Link>
    </Section>
  );
}
