import Stripe from "stripe";

// Client Stripe lato server. In assenza di chiave reale (dev/test iniziale)
// usa un placeholder: le chiamate falliranno solo quando effettivamente invocate.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

export const STRIPE_ENABLED =
  !!process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder";
