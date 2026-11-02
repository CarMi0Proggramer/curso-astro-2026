/**
 * @typedef {{ documentId: string, quantity: number }} CartLine
 */

/**
 * Returns a new cart with the product's quantity changed by `delta`.
 * Adds the line when missing and drops it when the quantity reaches zero.
 * @param {CartLine[]} cartLines
 * @param {string} documentId
 * @param {number} delta
 * @returns {CartLine[]}
 */
export function changeLineQuantity(cartLines, documentId, delta) {
  const isProductInCart = cartLines.some(
    (line) => line.documentId === documentId,
  );

  if (!isProductInCart) {
    return delta > 0 ? [...cartLines, { documentId, quantity: delta }] : cartLines;
  }

  return cartLines
    .map((line) =>
      line.documentId === documentId
        ? { ...line, quantity: line.quantity + delta }
        : line,
    )
    .filter((line) => line.quantity > 0);
}
