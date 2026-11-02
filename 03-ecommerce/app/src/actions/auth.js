import { defineAction } from "astro:actions";

export const auth = {
  logOut: defineAction({
    handler: async (__, ctx) => {
      const auth = await ctx.session.get("auth");
      if (!auth) {
        return true;
      }

      ctx.session.destroy();
      await fetch(`${import.meta.env.STRAPI_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.jwt}`,
        },
      });

      return true;
    },
  }),
};
