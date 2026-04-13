import RouteEditor from "@/components/route-editor-v2";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1540, margin: "0 auto", padding: "28px 22px 36px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "flex-start",
          marginBottom: 8,
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "clamp(1.7rem, 3vw, 2.8rem)", lineHeight: 1.05 }}>
            Smart Route List
          </h1>
          <p style={{ margin: "10px 0 0", maxWidth: 900, color: "var(--text-muted)", fontSize: "0.96rem", lineHeight: 1.5 }}>
            Редактор групп и маршрутов с загрузкой из GitHub, быстрым поиском лишних дублей и подсказками,
            когда отдельный IP уже покрывается более широкой подсетью.
          </p>
        </div>

        <form action="/api/logout" method="post">
          <button
            type="submit"
            style={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(12, 20, 35, 0.82)",
              color: "var(--text)",
              padding: "10px 14px",
              cursor: "pointer",
              fontSize: 14
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
