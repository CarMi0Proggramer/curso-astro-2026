import Stripe from "stripe";
import { getProductsByDocumentIds } from "../../../lib/strapi/catalog";

const cancelledEvents = new Set([
  "payment_intent.canceled",
  "checkout.session.expired",
]);

const successEvents = new Set([
  "payment_intent.succeeded",
  "checkout.session.completed",
]);

/**
 *
 * @param {import("astro").APIContext} ctx
 */
export const POST = async (ctx) => {
  console.log("Received Stripe webhook event");
  const stripe = new Stripe(import.meta.env.STRIPE_SECRET);
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  const sig = ctx.request.headers.get("stripe-signature");
  const rawBody = await ctx.request.text();

  try {
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (cancelledEvents.has(event.type)) {
      const reservedLines = JSON.parse(
        event.data.object.metadata.reservedLines || "[]",
      );

      const products = await getProductsByDocumentIds(
        reservedLines.map((line) => line.documentId),
      );

      await restoreStockForProducts(reservedLines, products);
    } else if (successEvents.has(event.type)) {
      return new Response("Success", { status: 200 });
    }

    return new Response("Event type not handled", { status: 200 });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      return new Response("Invalid stripe signature", { status: 400 });
    }

    return new Response("Internal server error", { status: 500 });
  }
};
