import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-4xl">This page is not here</h1>
      <p className="mt-3 text-sm text-ink-muted">The path you followed does not exist in Chema.</p>
      <Button href="/" className="mt-6">
        Return home
      </Button>
    </div>
  );
}
