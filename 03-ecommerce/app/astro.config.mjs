// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import node from "@astrojs/node";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  fonts: [
    {
      name: "Inter",
      provider: fontProviders.fontsource(),
      cssVariable: "--font-inter",
    },
  ],
  image: {
    domains: ["fakestoreapi.com"],
  },
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  integrations: [vue()],
});
