import { sequence } from "astro:middleware";

const astroOwnPaths = ["_server-islands", "_actions", "_image"];
const allowedRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/stripe/webhook",
];

/**
 *
 * @param {import("astro").APIContext} ctx
 * @param {import("astro").MiddlewareNext} next
 * @returns
 */
const authMiddleware = async (ctx, next) => {
  const { pathname } = ctx.url;

  const isAstroOwnPath = astroOwnPaths.some((path) =>
    pathname.startsWith(`/${path}`),
  );

  if (isAstroOwnPath) {
    return next();
  }

  const isAllowedRoute = allowedRoutes.some((route) => pathname === route);
  if (!isAllowedRoute) {
    const isLoggedIn = Boolean(await ctx.session.get("auth"));

    if (!isLoggedIn) {
      return ctx.redirect("/auth/login");
    }
  }

  next();
};

export const onRequest = sequence(authMiddleware);
