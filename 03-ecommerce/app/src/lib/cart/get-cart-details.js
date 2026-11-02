import { getProductsByDocumentIds } from "../strapi/catalog";
import { getCartItemCount } from "../../utils/cart-count";

/**
 * Joins the session cart lines with their product data and computes totals.
 * Lines whose product no longer exists are skipped.
 * @param {Array<{ documentId: string, quantity: number }>} cartLines
 */
export async function getCartDetails(cartLines) {
  const products = await getProductsByDocumentIds(
    cartLines.map((line) => line.documentId),
  );
  const productsByDocumentId = new Map(
    products.map((product) => [product.documentId, product]),
  );

  const items = cartLines
    .filter((line) => productsByDocumentId.has(line.documentId))
    .map((line) => {
      const product = productsByDocumentId.get(line.documentId);
      return {
        product,
        quantity: line.quantity,
        subtotal: Number(product.price) * line.quantity,
      };
    });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return { items, total, itemCount: getCartItemCount(cartLines) };
}
