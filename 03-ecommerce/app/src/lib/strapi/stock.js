export async function reserveStockForProducts(cart, products) {
  return await Promise.all(
    cart.map(async (cartItem) => {
      const product = products.find(
        (p) => p.documentId === cartItem.documentId,
      );
      const newStock = product.stock - cartItem.quantity;

      const res = await fetch(
        `${import.meta.env.STRAPI_URL}/api/products/${product.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.STRAPI_STOCK_TOKEN}`,
          },
          body: JSON.stringify({ data: { stock: newStock } }),
        },
      );

      return res.json();
    }),
  );
}

export async function restoreStockForProducts(reservedLines, products) {
  return await Promise.all(
    reservedLines.map(async (line) => {
      const product = products.find((p) => p.documentId === line.documentId);
      const newStock = product.stock + line.quantity;

      const res = await fetch(
        `${import.meta.env.STRAPI_URL}/api/products/${product.documentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.STRAPI_STOCK_TOKEN}`,
          },
          body: JSON.stringify({ data: { stock: newStock } }),
        },
      );

      return res.json();
    }),
  );
}
