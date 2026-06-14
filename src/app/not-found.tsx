import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="headline mb-4">Page not found</h1>
      <Link href="/" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white no-underline">
        Back to home
      </Link>
    </div>
  );
}
