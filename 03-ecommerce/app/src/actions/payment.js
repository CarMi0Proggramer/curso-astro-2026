import Stripe from "stripe";
import { getProductsByDocumentIds } from "../lib/strapi/catalog";
import { ActionError, defineAction } from "astro:actions";
import { reserveStockForProducts } from "../lib/strapi/stock";

function assertProductQuantity(cartItem, products) {
  const product = products.find((p) => p.documentId === cartItem.documentId);

  if (cartItem.quantity > product.stock) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: `The product ${product.name} has only ${product.stock} items in stock. You requested ${cartItem.quantity}.`,
    });
  }
}

export const payment = {
  createPaymentIntent: defineAction({
    handler: async (_, ctx) => {
      const stripe = new Stripe(import.meta.env.STRIPE_SECRET);

      const cart = (await ctx.session.get("cart")) ?? [];
      const products = await getProductsByDocumentIds(
        cart.map((line) => line.documentId),
      );

      cart.forEach((cartItem) => assertProductQuantity(cartItem, products));

      const lineItems = products.map((product) => {
        const cartLine = cart.find((line) => line.documentId === product.documentId);

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: [product.image],
            },
            unit_amount: Math.round(Number(product.price) * 100),
          },
          quantity: cartLine.quantity,
        };
      });

      await reserveStockForProducts(cart, products);

      const checkoutSession = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        success_url: `http://localhost:4321/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:4321/payments/cancelled?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          reservedLines: JSON.stringify(cart),
        },
      });

      return { url: checkoutSession.url };
    },
  }),
};
