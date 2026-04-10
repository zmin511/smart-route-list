import RouteEditor from "@/components/route-editor";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1>Smart Route Admin</h1>
          <p>Edit groups, domains, and CIDR entries for smart-route-list.txt.</p>
        </div>

        <form action="/api/logout" method="post">
          <button type="submit" style={{ padding: "10px 14px", borderRadius: 10, border: 0, cursor: "pointer" }}>
            Logout
          </button>
        </form>
      </div>

      <RouteEditor />
    </main>
  );
}
