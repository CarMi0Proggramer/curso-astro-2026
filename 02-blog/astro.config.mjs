// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.VITE_SITE_URL ?? "http://localhost:4321",
  integrations: [sitemap()],
});
