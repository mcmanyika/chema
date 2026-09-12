import { jsonOk } from "@/lib/api/http";

export const dynamic = "force-dynamic";

function publishableKey() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  return key.startsWith("pk_") ? key : null;
}

export async function GET() {
  const key = publishableKey();
  return jsonOk({
    publishableKey: key,
    configured: Boolean(key),
  });
}
