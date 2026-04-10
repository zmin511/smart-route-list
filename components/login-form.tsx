"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error || "Не удалось войти");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Логин</span>
        <input
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #2d3654", background: "#0f1424", color: "#fff" }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Пароль</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #2d3654", background: "#0f1424", color: "#fff" }}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "12px 18px", borderRadius: 10, border: 0, cursor: "pointer" }}
      >
        {loading ? "Вход..." : "Войти"}
      </button>

      {error ? <div style={{ color: "#ff8a8a" }}>{error}</div> : null}
    </form>
  );
}
