"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 420, background: "#151b2f", borderRadius: 16, padding: 24 }}>
        <h1>Smart Route Admin</h1>
        <p>Вход только через GitHub и только для разрешенного аккаунта.</p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          style={{ padding: "12px 18px", borderRadius: 10, border: 0, cursor: "pointer" }}
        >
          Войти через GitHub
        </button>
      </div>
    </main>
  );
}
