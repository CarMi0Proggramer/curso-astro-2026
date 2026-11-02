export const MAX_DISPLAYED_CART_COUNT = 99;

/**
 *
 * @param {number[]} cartLines
 * @returns
 */
export function getCartItemCount(cartLines) {
  if (!Array.isArray(cartLines)) return 0;
  return cartLines.reduce((total, line) => total + (line.quantity ?? 0), 0);
}

export function formatCartCount(count) {
  return count > MAX_DISPLAYED_CART_COUNT
    ? `${MAX_DISPLAYED_CART_COUNT}+`
    : String(count);
}

export function getCartAriaLabel(count) {
  if (count === 0) return "Carrito de compras, vacío";
  const noun = count === 1 ? "artículo" : "artículos";
  return `Carrito de compras, ${count} ${noun}`;
}
