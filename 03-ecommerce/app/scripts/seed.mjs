// Script de seed para Strapi 5: inserta categorías y productos desde stub-data.json.
//
// Uso:
//   STRAPI_URL=http://localhost:1337 STRAPI_TOKEN=xxxxx node scripts/seed.mjs
//
// Variables de entorno:
//   STRAPI_URL    URL base de Strapi (por defecto http://localhost:1337)
//   STRAPI_TOKEN  API Token de Strapi (recomendado; necesario si create/find requieren auth)
//   DRY_RUN       Si es "true", no escribe en Strapi; solo muestra lo que haría.
//
// El campo `description` del producto en el schema actual es `richtext`,
// por lo que se envía como string markdown. El stub también incluye
// `descriptionBlocks` por si el campo se migra al tipo `blocks`.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createStrapiClient } from "./strapi-client.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const STUB_PATH = join(scriptDir, "stub-data.json");

const config = {
  baseUrl: process.env.STRAPI_URL ?? "http://localhost:1337",
  token:
    "5a063788e4c909a62cd4e669641a1fc63b9bbbe840a611c69e39daff03598e45a7982a6e3aaca9b463657e2460167d4d3441612fd0b8eaf026b42103876acac7db09954511932478c34f8f7e320d4d3caa1a9ea65969b9e9efb534b01f0d06e265dfdaba7b8bac1358dead8b019ac5f208d7b308eac21a6a88d27f6206fb22e4",
  dryRun: process.env.DRY_RUN === "true",
};

async function loadStub() {
  const raw = await readFile(STUB_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.categories) || !Array.isArray(data.products)) {
    throw new Error(
      "stub-data.json inválido: faltan arrays 'categories' o 'products'.",
    );
  }
  return data;
}

/**
 * Crea las categorías (si no existen) y devuelve un mapa slug -> documentId/id.
 */
async function seedCategories({ client, categories }) {
  const slugToId = new Map();

  for (const category of categories) {
    const existing = config.dryRun
      ? null
      : await client.findOneByField({
          resource: "categories",
          field: "slug",
          value: category.slug,
        });

    if (existing) {
      slugToId.set(category.slug, existing.documentId ?? existing.id);
      console.log(`• Categoría ya existe: ${category.slug}`);
      continue;
    }

    if (config.dryRun) {
      console.log(`• [dry-run] crearía categoría: ${category.slug}`);
      slugToId.set(category.slug, `dry-${category.slug}`);
      continue;
    }

    const created = await client.create({
      resource: "categories",
      data: { slug: category.slug, name: category.name },
    });
    slugToId.set(category.slug, created.documentId ?? created.id);
    console.log(`✓ Categoría creada: ${category.slug}`);
  }

  return slugToId;
}

/**
 * Crea los productos (si no existen), enlazando su categoría por el mapa de slugs.
 */
async function seedProducts({ client, products, slugToId }) {
  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const categoryId = slugToId.get(product.category);
    if (!categoryId) {
      console.warn(
        `⚠ Producto "${product.slug}" referencia categoría desconocida "${product.category}". Se omite.`,
      );
      skipped++;
      continue;
    }

    const existing = config.dryRun
      ? null
      : await client.findOneByField({
          resource: "products",
          field: "slug",
          value: product.slug,
        });

    if (existing) {
      console.log(`• Producto ya existe: ${product.slug}`);
      skipped++;
      continue;
    }

    const payload = {
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      image: product.image,
      description: product.description, // richtext (string markdown)
      category: categoryId, // relación por documentId/id
    };

    if (config.dryRun) {
      console.log(`• [dry-run] crearía producto: ${product.slug}`);
      created++;
      continue;
    }

    await client.create({ resource: "products", data: payload });
    console.log(`✓ Producto creado: ${product.slug}`);
    created++;
  }

  return { created, skipped };
}

async function main() {
  console.log(
    `Seed Strapi → ${config.baseUrl}${config.dryRun ? " (DRY RUN)" : ""}`,
  );
  if (!config.token && !config.dryRun) {
    console.warn(
      "⚠ Sin STRAPI_TOKEN. Si la API requiere autenticación, las peticiones fallarán con 401/403.",
    );
  }

  const stub = await loadStub();
  const client = createStrapiClient({
    baseUrl: config.baseUrl,
    token: config.token,
  });

  const slugToId = await seedCategories({
    client,
    categories: stub.categories,
  });
  const { created, skipped } = await seedProducts({
    client,
    products: stub.products,
    slugToId,
  });

  console.log("\nResumen:");
  console.log(`  Categorías procesadas: ${stub.categories.length}`);
  console.log(`  Productos creados:     ${created}`);
  console.log(`  Productos omitidos:    ${skipped}`);
  console.log("Listo.");
}

main().catch((error) => {
  console.error(`\n✗ Error en el seed: ${error.message}`);
  process.exitCode = 1;
});
