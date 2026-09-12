import { NextResponse } from "next/server";
import { ZodError } from "zod";
import Stripe from "stripe";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Invalid request";
    return jsonError(message, 422);
  }
  if (error instanceof Stripe.errors.StripeError) {
    return jsonError(error.message, error.statusCode ?? 400);
  }
  if (error instanceof Error) {
    if (/STRIPE_|Firebase Admin|not configured/i.test(error.message)) {
      return jsonError(error.message, 500);
    }
  }
  console.error(error);
  return jsonError("Something went wrong. Please try again.", 500);
}
