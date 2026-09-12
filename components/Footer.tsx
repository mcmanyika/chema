import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-cream-dark/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl text-forest">Chema</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-ink-muted">
            A dignified way for Zimbabweans and diaspora communities to stand together in bereavement.
          </p>
        </div>
        <div className="flex gap-5 text-sm text-ink-muted">
          <Link href="/campaigns">Campaigns</Link>
          <Link href="/communities">Communities</Link>
          <Link href="/campaigns/create">Start a Chema</Link>
        </div>
      </div>
    </footer>
  );
}
