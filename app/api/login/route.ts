import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createAuthCookieValue,
  getAdminCredentials,
  getAuthCookieMaxAge
} from "@/lib/auth";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let username = "";
  let password = "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as LoginBody;
    username = body.username?.trim() || "";
    password = body.password || "";
  } else {
    const formData = await request.formData();
    username = String(formData.get("username") || "").trim();
    password = String(formData.get("password") || "");
  }

  const credentials = getAdminCredentials();

  if (username !== credentials.username || password !== credentials.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const cookieValue = await createAuthCookieValue(credentials.username);

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getAuthCookieMaxAge()
  });

  return response;
}
