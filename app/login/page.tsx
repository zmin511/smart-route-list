import LoginForm from "@/components/login-form";

export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 420, background: "#151b2f", borderRadius: 16, padding: 24 }}>
        <h1>Smart Route Admin</h1>
        <p>Sign in with the admin username and password from environment variables.</p>
        <LoginForm />
      </div>
    </main>
  );
}
