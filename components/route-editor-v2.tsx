"use client";

import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
import { generateSmartRouteList } from "@/lib/generator";
import { RouteItem, RouteItemType, RoutesData } from "@/lib/types";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function parseBulkValues(input: string) {
  return input
    .split(/[\n,;]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function isIpv4(value: string) {
  const parts = value.trim().split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

function parseIpv4(value: string) {
  if (!isIpv4(value)) return null;

  return value
    .trim()
    .split(".")
    .map(Number)
    .reduce((acc, part) => ((acc << 8) | part) >>> 0, 0);
}

function parseCidr(value: string) {
  const [ip, maskRaw] = value.trim().split("/");
  const mask = Number(maskRaw);
  const ipInt = parseIpv4(ip);

  if (ipInt === null || !Number.isInteger(mask) || mask < 0 || mask > 32) {
    return null;
  }

  const maskBits = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0;
  return {
    mask,
    maskBits,
    network: (ipInt & maskBits) >>> 0
  };
}

function cidrContains(cidrValue: string, candidateValue: string) {
  const cidr = parseCidr(cidrValue);
  if (!cidr) return false;

  if (candidateValue.includes("/")) {
    const candidate = parseCidr(candidateValue);
    if (!candidate) return false;
    return candidate.mask >= cidr.mask && (candidate.network & cidr.maskBits) === cidr.network;
  }

  const ip = parseIpv4(candidateValue);
  if (ip === null) return false;
  return (ip & cidr.maskBits) === cidr.network;
}

function inferType(value: string): RouteItemType {
  return /^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/.test(value) ? "cidr" : "domain";
}

function itemKind(item: RouteItem) {
  if (item.type === "domain") return "Домен";
  return item.value.includes("/") ? "Подсеть" : "IP";
}

function summarizeIssues(data: RoutesData) {
  const exactDuplicates = new Set<string>();
  const overlapItems = new Set<string>();
  const labels = new Map<string, string[]>();
  const seen = new Map<string, string[]>();

  for (const group of data.groups) {
    for (const item of group.items) {
      const value = normalizeValue(item.value);
      if (!value) continue;
      const existing = seen.get(value) ?? [];
      existing.push(item.id);
      seen.set(value, existing);
    }
  }

  for (const ids of seen.values()) {
    if (ids.length > 1) {
      ids.forEach((id) => exactDuplicates.add(id));
    }
  }

  const cidrs = data.groups.flatMap((group) =>
    group.items
      .filter((item) => item.type === "cidr" && parseCidr(item.value))
      .map((item) => ({ groupName: group.name || "Без названия", item }))
  );

  for (const parent of cidrs) {
    for (const group of data.groups) {
      for (const candidate of group.items) {
        if (candidate.id === parent.item.id || candidate.type !== "cidr") continue;
        if (!cidrContains(parent.item.value, candidate.value)) continue;

        overlapItems.add(parent.item.id);
        overlapItems.add(candidate.id);

        const childText = `Входит в ${parent.item.value} из группы «${parent.groupName}»`;
        const parentText = `Содержит ${candidate.value} из группы «${group.name || "Без названия"}»`;

        labels.set(candidate.id, [...(labels.get(candidate.id) ?? []), childText]);
        labels.set(parent.item.id, [...(labels.get(parent.item.id) ?? []), parentText]);
      }
    }
  }

  return { exactDuplicates, overlapItems, labels };
}

function Badge({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "warning" | "danger";
}) {
  const styles: Record<string, CSSProperties> = {
    default: {
      borderColor: "rgba(118, 164, 209, 0.18)",
      color: "var(--text-muted)",
      background: "rgba(14, 22, 38, 0.72)"
    },
    warning: {
      borderColor: "rgba(255, 196, 107, 0.3)",
      color: "var(--warning)",
      background: "rgba(64, 43, 10, 0.34)"
    },
    danger: {
      borderColor: "rgba(255, 125, 125, 0.3)",
      color: "var(--danger)",
      background: "rgba(60, 17, 22, 0.46)"
    }
  };

  return (
    <span
      style={{
        ...styles[tone],
        display: "inline-flex",
        alignItems: "center",
        minHeight: 28,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid",
        fontSize: 12.5,
        whiteSpace: "nowrap"
      }}
    >
      {children}
    </span>
  );
}

const fieldStyle: CSSProperties = {
  width: "100%",
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "rgba(7, 14, 24, 0.92)",
  color: "var(--text)",
  padding: "14px 16px",
  outline: "none"
};

const labelStyle: CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const panelStyle: CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)"
};

function buttonStyle(kind: "primary" | "ghost" | "danger"): CSSProperties {
  if (kind === "primary") {
    return {
      borderRadius: 16,
      border: "1px solid rgba(63, 215, 196, 0.35)",
      background: "linear-gradient(135deg, rgba(22, 121, 112, 0.95), rgba(14, 75, 88, 0.95))",
      color: "#effffe",
      padding: "13px 16px",
      cursor: "pointer"
    };
  }

  if (kind === "danger") {
    return {
      borderRadius: 16,
      border: "1px solid rgba(255, 125, 125, 0.28)",
      background: "rgba(56, 18, 23, 0.78)",
      color: "#ffd3d3",
      padding: "13px 16px",
      cursor: "pointer"
    };
  }

  return {
    borderRadius: 16,
    border: "1px solid var(--border)",
    background: "rgba(12, 20, 35, 0.82)",
    color: "var(--text)",
    padding: "13px 16px",
    cursor: "pointer"
  };
}

export default function RouteEditorV2() {
  const [data, setData] = useState<RoutesData>({ groups: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function loadRoutes(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    setMessage("");

    const response = await fetch("/api/routes", { cache: "no-store" });
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessageTone("error");
      setMessage(json.error || "Не удалось загрузить данные из GitHub");
      setLoading(false);
      if (showRefresh) setRefreshing(false);
      return;
    }

    const loadedData = (json.data || { groups: [] }) as RoutesData;
    setData(loadedData);
    setExpanded(
      loadedData.groups.reduce<Record<string, boolean>>((acc, group, index) => {
        acc[group.id] = index < 4;
        return acc;
      }, {})
    );
    setSelectedGroupId((current) =>
      current && loadedData.groups.some((group) => group.id === current)
        ? current
        : loadedData.groups[0]?.id || ""
    );

    if (showRefresh) {
      setMessageTone("success");
      setMessage("Список обновлён из GitHub");
    }

    setLoading(false);
    if (showRefresh) setRefreshing(false);
  }

  useEffect(() => {
    void loadRoutes();
  }, []);

  function updateData(updater: (current: RoutesData) => RoutesData) {
    setData((current) => updater(structuredClone(current)));
  }

  const preview = useMemo(() => generateSmartRouteList(data), [data]);
  const issues = useMemo(() => summarizeIssues(data), [data]);

  const selectedGroup = useMemo(
    () => data.groups.find((group) => group.id === selectedGroupId) ?? null,
    [data.groups, selectedGroupId]
  );

  const allExistingValues = useMemo(
    () => new Set(data.groups.flatMap((group) => group.items.map((item) => normalizeValue(item.value)))),
    [data.groups]
  );

  const bulkValues = useMemo(() => parseBulkValues(bulkInput), [bulkInput]);
  const duplicateValues = useMemo(
    () =>
      bulkValues.filter((value, index) => {
        const normalized = normalizeValue(value);
        return (
          allExistingValues.has(normalized) ||
          bulkValues.findIndex((item) => normalizeValue(item) === normalized) !== index
        );
      }),
    [allExistingValues, bulkValues]
  );

  const uniqueBulkValues = useMemo(
    () =>
      bulkValues.filter((value, index) => {
        const normalized = normalizeValue(value);
        return (
          !allExistingValues.has(normalized) &&
          bulkValues.findIndex((item) => normalizeValue(item) === normalized) === index
        );
      }),
    [allExistingValues, bulkValues]
  );

  const stats = useMemo(() => {
    const totalItems = data.groups.reduce((sum, group) => sum + group.items.length, 0);
    const domains = data.groups.reduce(
      (sum, group) => sum + group.items.filter((item) => item.type === "domain").length,
      0
    );

    return [
      { label: "Всего групп", value: data.groups.length, tone: "default" },
      { label: "Всего записей", value: totalItems, tone: "accent" },
      { label: "CIDR и IP", value: totalItems - domains, tone: "default" },
      { label: "Домены", value: domains, tone: "default" },
      { label: "Новых к добавлению", value: uniqueBulkValues.length, tone: "accent" },
      {
        label: "Точные дубли",
        value: issues.exactDuplicates.size + duplicateValues.length,
        tone: issues.exactDuplicates.size + duplicateValues.length ? "danger" : "accent"
      },
      {
        label: "Пересечения",
        value: issues.overlapItems.size,
        tone: issues.overlapItems.size ? "warning" : "accent"
      }
    ] as const;
  }, [data.groups, duplicateValues.length, issues.exactDuplicates.size, issues.overlapItems.size, uniqueBulkValues.length]);

  function addGroup() {
    const name = newGroupName.trim();

    if (!name) {
      setMessageTone("info");
      setMessage("Введите название новой группы");
      return;
    }

    const exists = data.groups.some((group) => normalizeValue(group.name) === normalizeValue(name));
    if (exists) {
      setMessageTone("error");
      setMessage("Группа с таким названием уже существует");
      return;
    }

    const group = { id: makeId(), name, items: [] };
    updateData((current) => {
      current.groups.push(group);
      return current;
    });
    setExpanded((current) => ({ ...current, [group.id]: true }));
    setSelectedGroupId(group.id);
    setNewGroupName("");
    setMessageTone("success");
    setMessage(`Группа «${name}» создана`);
  }

  function addBulkToGroup() {
    if (!selectedGroupId) {
      setMessageTone("info");
      setMessage("Сначала выберите группу");
      return;
    }

    if (uniqueBulkValues.length === 0) {
      setMessageTone("info");
      setMessage("Нет новых значений для добавления");
      return;
    }

    updateData((current) => {
      const group = current.groups.find((item) => item.id === selectedGroupId);
      if (!group) {
        return current;
      }

      for (const value of uniqueBulkValues) {
        group.items.unshift({
          id: makeId(),
          type: inferType(value),
          value
        });
      }

      return current;
    });

    setExpanded((current) => ({ ...current, [selectedGroupId]: true }));
    setMessageTone("success");
    setMessage(`Добавлено: ${uniqueBulkValues.length}`);
    setBulkInput("");
  }

  async function save() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessageTone("error");
      setMessage(json.error || "Не удалось сохранить изменения");
      setSaving(false);
      return;
    }

    setMessageTone("success");
    setMessage("Изменения сохранены в GitHub");
    setSaving(false);
  }

  function downloadPreview() {
    const blob = new Blob([preview], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-route-list.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div style={{ padding: "48px 0", color: "var(--text-muted)" }}>Загрузка данных из GitHub...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 24, marginTop: 28 }}>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {stats.map((card) => (
          <article
            key={card.label}
            style={{
              border: "1px solid",
              borderColor:
                card.tone === "danger"
                  ? "rgba(255, 125, 125, 0.3)"
                  : card.tone === "warning"
                    ? "rgba(255, 196, 107, 0.3)"
                    : card.tone === "accent"
                      ? "rgba(63, 215, 196, 0.3)"
                      : "rgba(122, 155, 190, 0.18)",
              background:
                card.tone === "danger"
                  ? "linear-gradient(180deg, rgba(54, 18, 24, 0.82), rgba(23, 10, 13, 0.9))"
                  : card.tone === "warning"
                    ? "linear-gradient(180deg, rgba(52, 34, 13, 0.82), rgba(24, 18, 10, 0.9))"
                    : card.tone === "accent"
                      ? "linear-gradient(180deg, rgba(10, 45, 52, 0.84), rgba(9, 25, 34, 0.9))"
                      : "linear-gradient(180deg, rgba(16, 27, 44, 0.92), rgba(10, 18, 31, 0.86))",
              borderRadius: 22,
              padding: "18px 20px"
            }}
          >
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 10 }}>{card.label}</div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.04em" }}>{card.value}</div>
          </article>
        ))}
      </section>

      <section
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          padding: 16,
          borderRadius: 24,
          border: "1px solid var(--border)",
          background: "var(--panel-soft)"
        }}
      >
        {data.groups.map((group) => {
          const active = group.id === selectedGroupId;
          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              style={{
                minWidth: 150,
                textAlign: "left",
                cursor: "pointer",
                borderRadius: 16,
                border: active ? "1px solid rgba(63, 215, 196, 0.5)" : "1px solid var(--border)",
                background: active ? "rgba(13, 61, 61, 0.58)" : "rgba(13, 21, 35, 0.78)",
                color: "var(--text)",
                padding: "12px 16px"
              }}
            >
              <div style={{ fontWeight: 700 }}>{group.name || "Без названия"}</div>
              <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 13 }}>{group.items.length} записей</div>
            </button>
          );
        })}
      </section>

      <div
        style={{
          display: "grid",
          gap: 24,
          alignItems: "start",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
        }}
      >
        <aside style={{ display: "grid", gap: 18 }}>
          <section style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ ...labelStyle, color: "var(--text-dim)" }}>Центр управления</div>
                <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>Рабочая панель</h2>
              </div>
              <button onClick={() => void loadRoutes(true)} disabled={refreshing} style={buttonStyle("ghost")}>
                {refreshing ? "Обновляю..." : "GitHub"}
              </button>
            </div>

            <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
              <label style={labelStyle}>Активная группа</label>
              <select value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)} style={fieldStyle}>
                <option value="">Выберите группу</option>
                {data.groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.items.length})
                  </option>
                ))}
              </select>

              <label style={labelStyle}>Добавить IP, CIDR или домены</label>
              <textarea
                value={bulkInput}
                onChange={(event) => setBulkInput(event.target.value)}
                placeholder="Вставьте IP-адреса, подсети или домены. Разделяйте запятой или с новой строки."
                style={{ ...fieldStyle, minHeight: 170, resize: "vertical" }}
              />
              <button onClick={addBulkToGroup} style={buttonStyle("primary")}>
                Добавить в выбранную группу
              </button>
            </div>

            <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
              <label style={labelStyle}>Новая группа</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <input
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  placeholder="Название новой группы"
                  style={fieldStyle}
                />
                <button onClick={addGroup} style={buttonStyle("ghost")}>
                  Создать
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 22,
                padding: 14,
                borderRadius: 18,
                border: "1px solid rgba(118, 164, 209, 0.12)",
                background: "rgba(8, 14, 25, 0.72)",
                color: "var(--text-muted)",
                fontSize: 14,
                lineHeight: 1.55
              }}
            >
              <div>Загружено групп: {data.groups.length}</div>
              <div>Всего записей: {data.groups.reduce((sum, group) => sum + group.items.length, 0)}</div>
              <div>Готово к добавлению: {uniqueBulkValues.length}</div>
              <div>Дубликатов пропущено: {duplicateValues.length}</div>
            </div>

            {duplicateValues.length > 0 ? (
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <label style={labelStyle}>Дубли в текущей вставке</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {duplicateValues.map((value) => (
                    <Badge key={value} tone="warning">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section style={{ ...panelStyle, display: "grid", gap: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 22 }}>Общий список</h3>
              <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 14 }}>
                Сохранение в GitHub и локальная выгрузка итогового файла
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => void save()} disabled={saving} style={buttonStyle("primary")}>
                {saving ? "Сохраняю..." : "Сохранить в GitHub"}
              </button>
              <button onClick={downloadPreview} style={buttonStyle("ghost")}>
                Скачать файл
              </button>
            </div>

            {message ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid",
                  borderColor:
                    messageTone === "error"
                      ? "rgba(255, 125, 125, 0.3)"
                      : messageTone === "success"
                        ? "rgba(63, 215, 196, 0.26)"
                        : "rgba(118, 164, 209, 0.24)",
                  background:
                    messageTone === "error"
                      ? "rgba(60, 17, 22, 0.5)"
                      : messageTone === "success"
                        ? "rgba(7, 42, 40, 0.5)"
                        : "rgba(12, 20, 35, 0.7)"
                }}
              >
                {message}
              </div>
            ) : null}

            <textarea
              readOnly
              value={preview}
              placeholder="Здесь будет итоговый smart-route-list.txt"
              style={{
                ...fieldStyle,
                minHeight: 240,
                resize: "vertical",
                fontFamily: "Consolas, 'Courier New', monospace",
                fontSize: 13.5,
                lineHeight: 1.55
              }}
            />
          </section>
        </aside>

        <section style={{ ...panelStyle, borderRadius: 30 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              marginBottom: 18,
              flexWrap: "wrap"
            }}
          >
            <div>
              <div style={{ ...labelStyle, color: "var(--text-dim)" }}>Группы и записи</div>
              <h2 style={{ margin: "8px 0 0", fontSize: 28 }}>Структура маршрутов</h2>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Секции можно сворачивать, чтобы длинный список был аккуратнее
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {data.groups.map((group, groupIndex) => {
              const open = expanded[group.id] ?? true;
              const active = group.id === selectedGroupId;
              const exactHits = group.items.filter((item) => issues.exactDuplicates.has(item.id)).length;
              const overlapHits = group.items.filter((item) => issues.overlapItems.has(item.id)).length;

              return (
                <article
                  key={group.id}
                  style={{
                    borderRadius: 24,
                    border: active ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                    background: active ? "rgba(10, 34, 40, 0.74)" : "rgba(10, 18, 31, 0.78)",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      padding: "16px 18px",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 14,
                      alignItems: "center"
                    }}
                  >
                    <button
                      onClick={() => setExpanded((current) => ({ ...current, [group.id]: !open }))}
                      style={{ ...buttonStyle("ghost"), width: 42, height: 42, padding: 0, fontSize: 18 }}
                    >
                      {open ? "-" : "+"}
                    </button>

                    <div>
                      <input
                        value={group.name}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateData((current) => {
                            current.groups[groupIndex].name = value;
                            return current;
                          });
                        }}
                        style={{ ...fieldStyle, padding: "10px 12px", fontWeight: 700, fontSize: 18 }}
                      />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        <Badge>{group.items.length} записей</Badge>
                        {exactHits ? <Badge tone="danger">{exactHits} дублей</Badge> : null}
                        {overlapHits ? <Badge tone="warning">{overlapHits} пересечений</Badge> : null}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button onClick={() => setSelectedGroupId(group.id)} style={buttonStyle("ghost")}>
                        Открыть слева
                      </button>
                      <button
                        onClick={() => {
                          updateData((current) => {
                            current.groups.splice(groupIndex, 1);
                            return current;
                          });
                          setSelectedGroupId((current) => (current === group.id ? "" : current));
                        }}
                        style={buttonStyle("danger")}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>

                  {open ? (
                    <div style={{ padding: "0 18px 18px", display: "grid", gap: 10 }}>
                      {group.items.length === 0 ? (
                        <div
                          style={{
                            padding: "16px 18px",
                            borderRadius: 18,
                            color: "var(--text-muted)",
                            border: "1px dashed var(--border)"
                          }}
                        >
                          Группа пока пустая
                        </div>
                      ) : null}

                      {group.items.map((item, itemIndex) => {
                        const exact = issues.exactDuplicates.has(item.id);
                        const overlap = issues.overlapItems.has(item.id);
                        const notes = Array.from(new Set(issues.labels.get(item.id) ?? []));

                        return (
                          <div
                            key={item.id}
                            style={{
                              borderRadius: 18,
                              border: "1px solid",
                              borderColor: exact
                                ? "rgba(255, 125, 125, 0.32)"
                                : overlap
                                  ? "rgba(255, 196, 107, 0.3)"
                                  : "rgba(118, 164, 209, 0.14)",
                              background: exact
                                ? "rgba(62, 20, 23, 0.48)"
                                : overlap
                                  ? "rgba(64, 43, 10, 0.34)"
                                  : "rgba(9, 16, 27, 0.75)",
                              padding: 14
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "140px minmax(0, 1fr) auto",
                                gap: 12,
                                alignItems: "start"
                              }}
                            >
                              <select
                                value={item.type}
                                onChange={(event) => {
                                  const value = event.target.value as RouteItemType;
                                  updateData((current) => {
                                    current.groups[groupIndex].items[itemIndex].type = value;
                                    return current;
                                  });
                                }}
                                style={fieldStyle}
                              >
                                <option value="domain">domain</option>
                                <option value="cidr">cidr / ip</option>
                              </select>

                              <div>
                                <input
                                  value={item.value}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    updateData((current) => {
                                      current.groups[groupIndex].items[itemIndex].value = value;
                                      current.groups[groupIndex].items[itemIndex].type = inferType(value);
                                      return current;
                                    });
                                  }}
                                  style={fieldStyle}
                                />
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                  <Badge>{itemKind(item)}</Badge>
                                  {exact ? <Badge tone="danger">Точный дубль</Badge> : null}
                                  {overlap ? <Badge tone="warning">Есть пересечение</Badge> : null}
                                </div>
                                {notes.length > 0 ? (
                                  <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                                    {notes.map((note) => (
                                      <div key={note} style={{ color: "var(--warning)", fontSize: 13.5 }}>
                                        {note}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              <button
                                onClick={() => {
                                  updateData((current) => {
                                    current.groups[groupIndex].items.splice(itemIndex, 1);
                                    return current;
                                  });
                                }}
                                style={buttonStyle("danger")}
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
