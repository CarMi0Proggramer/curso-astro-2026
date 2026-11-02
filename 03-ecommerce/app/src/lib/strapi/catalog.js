import { fetchAllEntries } from "./client";

export function getCategories() {
  const query = new URLSearchParams({
    "fields[0]": "name",
    "fields[1]": "slug",
    "sort[0]": "name:asc",
  });
  return fetchAllEntries("categories", query);
}

/** @param {string} slug */
export async function getCategoryBySlug(slug) {
  const query = new URLSearchParams({
    "fields[0]": "name",
    "fields[1]": "slug",
    "filters[slug][$eq]": slug,
  });
  const [category] = await fetchAllEntries("categories", query);
  return category ?? null;
}

function buildProductsQuery() {
  return new URLSearchParams({
    "populate[category][fields][0]": "name",
    "sort[0]": "name:asc",
  });
}

export function getProducts() {
  return fetchAllEntries("products", buildProductsQuery());
}

/** @param {string} slug */
export async function getProductBySlug(slug) {
  const query = buildProductsQuery();
  query.set("filters[slug][$eq]", slug);
  const [product] = await fetchAllEntries("products", query);
  return product ?? null;
}

/** @param {string[]} documentIds */
export function getProductsByDocumentIds(documentIds) {
  if (documentIds.length === 0) return Promise.resolve([]);

  const query = buildProductsQuery();
  documentIds.forEach((documentId, index) => {
    query.set(`filters[documentId][$in][${index}]`, documentId);
  });
  return fetchAllEntries("products", query);
}

/** @param {string} categorySlug */
export function getProductsByCategory(categorySlug) {
  const query = buildProductsQuery();
  query.set("filters[category][slug][$eq]", categorySlug);
  return fetchAllEntries("products", query);
}
