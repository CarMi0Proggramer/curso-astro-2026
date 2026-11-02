import { z } from "astro/zod";

const loginSchema = z.object({
  email: z.email("Provide a valid email"),
  password: z.string().min(6, "Provide a password with at least 6 chars"),
});

/**
 * @param {import("astro").APIContext} ctx
 */
export const POST = async ({ request, redirect, session }) => {
  const body = await request.formData();
  const email = String(body.get("email") ?? "");
  const password = String(body.get("password") ?? "");

  const {
    success,
    data: loginPayload,
    error,
  } = loginSchema.safeParse({
    email,
    password,
  });

  if (!success) {
    const params = new URLSearchParams();
    error.issues.forEach((error) => {
      params.set(`${error.path[0]}Error`, error.message);
    });

    return redirect(`/auth/login?${params.toString()}`, 303);
  }

  const response = await fetch(`${import.meta.env.STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: loginPayload.email,
      password: loginPayload.password,
    }),
  });

  const authData = await response.json();

  if (!response.ok) {
    const params = new URLSearchParams();

    if (response.status === 400) {
      params.set("generalError", "Invalid credentials!");
    } else {
      params.set("generalError", "Internal server error");
    }

    return redirect(`/auth/login?${params.toString()}`, 303);
  }

  session.set("auth", {
    user: authData.user,
    jwt: authData.jwt,
  });

  return redirect("/", 303);
};
