import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <div className="text-5xl font-black text-stone-300">404</div>
        <p className="mt-2 text-stone-600">We couldn&apos;t find that page.</p>
        <Link href="/" className="btn-primary mt-4">Go to dashboard</Link>
      </div>
    </div>
  );
}
