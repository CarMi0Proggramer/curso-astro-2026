import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { getCartItemCount } from "../utils/cart-count";
import { changeLineQuantity } from "../utils/cart-lines";
import { getProductsByDocumentIds } from "../lib/strapi/catalog";

const documentIdSchema = z.string().min(1);
const cartFormSchema = z.object({
  documentId: documentIdSchema,
});

/**
 * Persists the cart in the session and returns the resulting item count.
 * @param {import("astro").ActionAPIContext} ctx
 * @param {Array<{ documentId: string, quantity: number }>} cartLines
 */
async function saveCart(ctx, cartLines) {
  await ctx.session.set("cart", cartLines);

  const products = await getProductsByDocumentIds(
    cartLines.map((line) => line.documentId),
  );

  const items = cartLines.map((line) => {
    const product = products.find((p) => p.documentId === line.documentId);

    return {
      product: {
        id: product.id,
        documentId: product.documentId,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        stock: product.stock,
      },
      quantity: line.quantity,
      subtotal: Number(product.price) * line.quantity,
    };
  });

  return { itemCount: getCartItemCount(cartLines), items };
}

/**
 * @param {import("astro").ActionAPIContext} ctx
 * @param {string} documentId
 * @param {number} delta
 */
async function updateQuantity(ctx, documentId, delta) {
  const cart = (await ctx.session.get("cart")) ?? [];
  return saveCart(ctx, changeLineQuantity(cart, documentId, delta));
}

export const cart = {
  increaseQuantity: defineAction({
    input: cartFormSchema,
    handler: ({ documentId }, ctx) => updateQuantity(ctx, documentId, 1),
  }),
  decreaseQuantity: defineAction({
    input: cartFormSchema,
    handler: ({ documentId }, ctx) => updateQuantity(ctx, documentId, -1),
  }),
  removeFromCart: defineAction({
    input: documentIdSchema,
    handler: async (documentId, ctx) => {
      const cart = (await ctx.session.get("cart")) ?? [];
      const updatedCart = cart.filter((item) => item.documentId !== documentId);
      return saveCart(ctx, updatedCart);
    },
  }),
  getItemCount: defineAction({
    handler: async (_, ctx) => {
      const cart = (await ctx.session.get("cart")) ?? [];
      return { itemCount: getCartItemCount(cart) };
    },
  }),
};
