const encoder = new TextEncoder();

export const AUTH_COOKIE_NAME = "smart_route_auth";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function requireEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD" | "AUTH_SECRET") {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(signature);
}

export function getAdminCredentials() {
  return {
    username: requireEnv("ADMIN_USERNAME"),
    password: requireEnv("ADMIN_PASSWORD"),
    secret: requireEnv("AUTH_SECRET")
  };
}

export function getAuthCookieMaxAge() {
  return AUTH_COOKIE_MAX_AGE;
}

export async function createAuthCookieValue(username: string) {
  const { secret } = getAdminCredentials();
  const payload = `${username}:${Date.now()}`;
  const signature = await signValue(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifyAuthCookieValue(cookieValue?: string | null) {
  if (!cookieValue) {
    return false;
  }

  const dotIndex = cookieValue.lastIndexOf(".");
  if (dotIndex <= 0) {
    return false;
  }

  const payload = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);
  const [username] = payload.split(":");

  if (!username) {
    return false;
  }

  const credentials = getAdminCredentials();
  if (username !== credentials.username) {
    return false;
  }

  const expectedSignature = await signValue(payload, credentials.secret);
  return signature === expectedSignature;
}
