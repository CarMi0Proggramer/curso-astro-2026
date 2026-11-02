import { z } from "astro/zod";

const signupSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.email("Provide a valid email"),
  password: z.string().min(6, "Provide a password with at least 6 chars"),
});

/**
 * @param {import("astro").APIContext} ctx
 */
export const POST = async ({ request, redirect, session }) => {
  const body = await request.formData();
  const username = String(body.get("username") ?? "");
  const email = String(body.get("email") ?? "");
  const password = String(body.get("password") ?? "");

  const {
    success,
    data: signupPayload,
    error,
  } = signupSchema.safeParse({
    username,
    email,
    password,
  });

  if (!success) {
    const params = new URLSearchParams();
    error.issues.forEach((error) => {
      params.set(`${error.path[0]}Error`, error.message);
    });

    return redirect(`/auth/signup?${params.toString()}`, 303);
  }

  const response = await fetch(
    `${import.meta.env.STRAPI_URL}/api/auth/local/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupPayload),
    },
  );

  const authData = await response.json();

  if (!response.ok) {
    const params = new URLSearchParams();

    if (authData?.error?.message === "Email or Username are already taken") {
      params.set("emailError", "Email or Username are already taken");
      return redirect(`/auth/signup?${params.toString()}`, 303);
    }

    params.set("generalError", "Internal server error");
    return redirect(`/auth/signup?${params.toString()}`, 303);
  }

  session.set("auth", {
    user: authData.user,
    jwt: authData.jwt,
  });

  return redirect("/", 303);
};
