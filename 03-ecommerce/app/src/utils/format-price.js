const priceFormatter = new Intl.NumberFormat("es", {
  style: "currency",
  currency: "USD",
});

export function formatPrice(price) {
  return priceFormatter.format(Number(price));
}
