// Restaura el campo `description` (tipo Rich text Blocks) de los productos
// en Strapi 5 a partir de stub-data.json.
//
// Uso:
//   STRAPI_TOKEN=xxxxx node scripts/restore-descriptions.mjs
//
// Variables de entorno:
//   STRAPI_URL    URL base de Strapi (por defecto http://localhost:1337)
//   STRAPI_TOKEN  API Token con permiso de find + update sobre products
//   DRY_RUN       Si es "true", no escribe en Strapi; solo muestra lo que haría.
//   FORCE         Si es "true", sobrescribe también descripciones no vacías.
//
// Requisito: el content-type Product debe tener ya el campo `description`
// de tipo "Rich text (Blocks)"; si no existe, Strapi responderá 400.

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
  force: process.env.FORCE === "true",
};

async function loadStubProducts() {
  const data = JSON.parse(await readFile(STUB_PATH, "utf8"));
  if (!Array.isArray(data.products)) {
    throw new Error("stub-data.json inválido: falta el array 'products'.");
  }
  return data.products;
}

/**
 * Devuelve la descripción en formato Blocks. Usa `descriptionBlocks` del stub
 * y, si no existe, envuelve el texto plano en un único párrafo.
 */
function toDescriptionBlocks(product) {
  if (Array.isArray(product.descriptionBlocks)) {
    return product.descriptionBlocks;
  }
  if (typeof product.description === "string" && product.description.trim()) {
    return [
      {
        type: "paragraph",
        children: [{ type: "text", text: product.description }],
      },
    ];
  }
  return null;
}

function hasDescription(entry) {
  return Array.isArray(entry.description) && entry.description.length > 0;
}

async function restoreProduct({ client, product }) {
  const blocks = toDescriptionBlocks(product);
  if (!blocks) {
    console.warn(`⚠ Sin descripción en el stub: ${product.slug}`);
    return "skipped";
  }

  const existing = await client.findOneByField({
    resource: "products",
    field: "slug",
    value: product.slug,
  });

  if (!existing) {
    console.warn(`⚠ No existe en Strapi: ${product.slug}`);
    return "missing";
  }

  if (hasDescription(existing) && !config.force) {
    console.log(`• Ya tiene descripción: ${product.slug}`);
    return "skipped";
  }

  if (config.dryRun) {
    console.log(`• [dry-run] restauraría: ${product.slug}`);
    return "restored";
  }

  await client.update({
    resource: "products",
    documentId: existing.documentId,
    data: { description: blocks },
  });
  console.log(`✓ Descripción restaurada: ${product.slug}`);
  return "restored";
}

async function main() {
  console.log(
    `Restaurar descripciones → ${config.baseUrl}${config.dryRun ? " (DRY RUN)" : ""}`,
  );
  if (!config.token) {
    throw new Error("Falta STRAPI_TOKEN (necesita permisos find + update).");
  }

  const client = createStrapiClient({
    baseUrl: config.baseUrl,
    token: config.token,
  });
  const products = await loadStubProducts();
  const totals = { restored: 0, skipped: 0, missing: 0 };

  // Secuencial a propósito: evita saturar Strapi con escrituras concurrentes.
  for (const product of products) {
    const result = await restoreProduct({ client, product });
    totals[result]++;
  }

  console.log("\nResumen:");
  console.log(`  Restauradas:       ${totals.restored}`);
  console.log(`  Omitidas:          ${totals.skipped}`);
  console.log(`  No encontradas:    ${totals.missing}`);
}

main().catch((error) => {
  console.error(`\n✗ Error restaurando descripciones: ${error.message}`);
  process.exitCode = 1;
});
