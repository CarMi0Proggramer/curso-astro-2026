const MAX_PAGE_SIZE = 100;

function getStrapiUrl() {
  const strapiUrl = import.meta.env.STRAPI_URL;
  if (!strapiUrl) {
    throw new Error("STRAPI_URL environment variable is not defined");
  }
  return strapiUrl;
}

/**
 * @param {string} collection
 * @param {URLSearchParams} query
 * @param {number} page
 */
async function fetchPage(collection, query, page) {
  const pageQuery = new URLSearchParams(query);
  pageQuery.set("pagination[page]", String(page));
  pageQuery.set("pagination[pageSize]", String(MAX_PAGE_SIZE));

  const response = await fetch(
    `${getStrapiUrl()}/api/${collection}?${pageQuery.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.STRAPI_READ_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Strapi request for "${collection}" failed with status ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Fetches every page of a Strapi collection and returns all entries.
 * @param {string} collection
 * @param {URLSearchParams} [query]
 */
export async function fetchAllEntries(
  collection,
  query = new URLSearchParams(),
) {
  const firstPage = await fetchPage(collection, query, 1);
  const { pageCount } = firstPage.meta.pagination;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchPage(collection, query, index + 2),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => {
    return page.data;
  });
}
