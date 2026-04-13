import RouteEditor from "@/components/route-editor-v2";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1540, margin: "0 auto", padding: "32px 24px 40px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
          marginBottom: 12,
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.05 }}>
            Smart Route List
          </h1>
          <p style={{ margin: "12px 0 0", maxWidth: 920, color: "var(--text-muted)", fontSize: "1.05rem" }}>
            Панель управления группами, доменами и CIDR с загрузкой из GitHub, быстрым редактированием,
            проверкой дублей и подсветкой IP, которые уже входят в подсети.
          </p>
        </div>

        <form action="/api/logout" method="post">
          <button
            type="submit"
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "rgba(12, 20, 35, 0.82)",
              color: "var(--text)",
              padding: "12px 16px",
              cursor: "pointer"
            }}
          >
            Выйти
          </button>
        </form>
      </div>
      <RouteEditor />
    </main>
  );
}
