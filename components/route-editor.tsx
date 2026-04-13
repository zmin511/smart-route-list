"use client";

import { useEffect, useState } from "react";
import { RoutesData } from "@/lib/types";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function RouteEditor() {
  const [data, setData] = useState<RoutesData>({ groups: [] });
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/routes")
      .then((res) => res.json())
      .then((json) => {
        setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await response.json();

    if (!response.ok) {
      setMessage(json.error || "Ошибка сохранения");
      setSaving(false);
      return;
    }

    setPreview(json.preview || "");
    setMessage("Сохранено в GitHub");
    setSaving(false);
  }

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button
        onClick={() =>
          setData((prev) => ({
            groups: [...prev.groups, { id: makeId(), name: "New Group", items: [] }]
          }))
        }
      >
        Добавить группу
      </button>

      {data.groups.map((group, groupIndex) => (
        <div key={group.id} style={{ background: "#151b2f", padding: 16, borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={group.name}
              onChange={(e) => {
                const value = e.target.value;
                setData((prev) => {
                  const copy = structuredClone(prev);
                  copy.groups[groupIndex].name = value;
                  return copy;
                });
              }}
              style={{ flex: 1, padding: 8 }}
            />
            <button
              onClick={() => {
                setData((prev) => {
                  const copy = structuredClone(prev);
                  copy.groups.splice(groupIndex, 1);
                  return copy;
                });
              }}
            >
              Удалить группу
            </button>
          </div>

          {group.items.map((item, itemIndex) => (
            <div key={item.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select
                value={item.type}
                onChange={(e) => {
                  const value = e.target.value as "domain" | "cidr";
                  setData((prev) => {
                    const copy = structuredClone(prev);
                    copy.groups[groupIndex].items[itemIndex].type = value;
                    return copy;
                  });
                }}
              >
                <option value="domain">domain</option>
                <option value="cidr">cidr</option>
              </select>

              <input
                value={item.value}
                onChange={(e) => {
                  const value = e.target.value;
                  setData((prev) => {
                    const copy = structuredClone(prev);
                    copy.groups[groupIndex].items[itemIndex].value = value;
                    return copy;
                  });
                }}
                style={{ flex: 1, padding: 8 }}
              />

              <button
                onClick={() => {
                  setData((prev) => {
                    const copy = structuredClone(prev);
                    copy.groups[groupIndex].items.splice(itemIndex, 1);
                    return copy;
                  });
                }}
              >
                Удалить
              </button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setData((prev) => {
                  const copy = structuredClone(prev);
                  copy.groups[groupIndex].items.push({ id: makeId(), type: "domain", value: "" });
                  return copy;
                });
              }}
            >
              Добавить домен
            </button>

            <button
              onClick={() => {
                setData((prev) => {
                  const copy = structuredClone(prev);
                  copy.groups[groupIndex].items.push({ id: makeId(), type: "cidr", value: "" });
                  return copy;
                });
              }}
            >
              Добавить CIDR
            </button>
          </div>
        </div>
      ))}

      <button onClick={save} disabled={saving}>
        {saving ? "Сохраняю..." : "Сохранить в GitHub"}
      </button>

      {message ? <div>{message}</div> : null}

      <textarea
        readOnly
        value={preview}
        placeholder="После сохранения здесь появится сгенерированный smart-route-list.txt"
        style={{ minHeight: 320, width: "100%", padding: 12 }}
      />
    </div>
  );
}
