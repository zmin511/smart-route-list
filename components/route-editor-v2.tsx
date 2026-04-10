"use client";

import { useEffect, useState } from "react";
import { generateSmartRouteList } from "@/lib/generator";
import { RouteItemType, RoutesData } from "@/lib/types";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function detectType(value: string): RouteItemType {
  return /^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(value) ? "cidr" : "domain";
}

function parseBulkValues(input: string) {
  return input
    .split(/[\n,;]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function RouteEditorV2() {
  const [data, setData] = useState<RoutesData>({ groups: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [bulkTypeMode, setBulkTypeMode] = useState<"auto" | RouteItemType>("auto");

  useEffect(() => {
    void loadRoutes();
  }, []);

  async function loadRoutes() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/routes", { cache: "no-store" });
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(json.error || "Failed to load routes from GitHub");
      setLoading(false);
      return;
    }

    const loadedData = (json.data || { groups: [] }) as RoutesData;
    setData(loadedData);
    setSelectedGroupId((current) => current || loadedData.groups[0]?.id || "");
    setLoading(false);
  }

  function updateData(updater: (current: RoutesData) => RoutesData) {
    setData((current) => updater(structuredClone(current)));
  }

  function addGroup() {
    const name = newGroupName.trim();

    if (!name) {
      setMessage("Enter a new group name");
      return;
    }

    const exists = data.groups.some((group) => normalizeValue(group.name) === normalizeValue(name));
    if (exists) {
      setMessage("A group with this name already exists");
      return;
    }

    const group = { id: makeId(), name, items: [] };
    updateData((current) => {
      current.groups.push(group);
      return current;
    });
    setSelectedGroupId(group.id);
    setNewGroupName("");
    setMessage(`Group "${name}" created`);
  }

  const allExistingValues = new Set(
    data.groups.flatMap((group) => group.items.map((item) => normalizeValue(item.value)))
  );

  const bulkValues = parseBulkValues(bulkInput);
  const duplicateValues = bulkValues.filter((value, index) => {
    const normalized = normalizeValue(value);
    return allExistingValues.has(normalized) || bulkValues.findIndex((item) => normalizeValue(item) === normalized) !== index;
  });
  const uniqueBulkValues = bulkValues.filter((value, index) => {
    const normalized = normalizeValue(value);
    return !allExistingValues.has(normalized) && bulkValues.findIndex((item) => normalizeValue(item) === normalized) === index;
  });

  function addBulkToGroup() {
    if (!selectedGroupId) {
      setMessage("Select a group first");
      return;
    }

    if (uniqueBulkValues.length === 0) {
      setMessage("Nothing new to add");
      return;
    }

    updateData((current) => {
      const group = current.groups.find((item) => item.id === selectedGroupId);
      if (!group) {
        return current;
      }

      for (const value of uniqueBulkValues) {
        group.items.push({
          id: makeId(),
          type: bulkTypeMode === "auto" ? detectType(value) : bulkTypeMode,
          value
        });
      }

      return current;
    });

    setMessage(`Added ${uniqueBulkValues.length} item(s)`);
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
      setMessage(json.error || "Save failed");
      setSaving(false);
      return;
    }

    setMessage("Saved to GitHub");
    setSaving(false);
  }

  function downloadPreview() {
    const blob = new Blob([generateSmartRouteList(data)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-route-list.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  const preview = generateSmartRouteList(data);

  if (loading) {
    return <div>Loading routes from GitHub...</div>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ background: "#151b2f", padding: 16, borderRadius: 12, display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr auto", gap: 10 }}>
          <select
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
            style={{ padding: 10, borderRadius: 10 }}
          >
            <option value="">Select group</option>
            {data.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.items.length})
              </option>
            ))}
          </select>

          <select
            value={bulkTypeMode}
            onChange={(event) => setBulkTypeMode(event.target.value as "auto" | RouteItemType)}
            style={{ padding: 10, borderRadius: 10 }}
          >
            <option value="auto">Auto detect type</option>
            <option value="domain">Domain</option>
            <option value="cidr">CIDR / IP</option>
          </select>

          <button onClick={loadRoutes}>Reload from GitHub</button>
        </div>

        <textarea
          value={bulkInput}
          onChange={(event) => setBulkInput(event.target.value)}
          placeholder="Paste IPs, CIDR ranges, or domains. Separate by comma or new line."
          style={{ minHeight: 110, width: "100%", padding: 12 }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={addBulkToGroup}>Add to selected group</button>
          <input
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            placeholder="New group name"
            style={{ flex: 1, minWidth: 220, padding: 10, borderRadius: 10 }}
          />
          <button onClick={addGroup}>Create group</button>
        </div>

        <div style={{ color: "#b7c0d8", fontSize: 14 }}>
          Ready to add: {uniqueBulkValues.length} | Duplicates skipped: {duplicateValues.length} | Groups loaded: {data.groups.length}
        </div>

        {duplicateValues.length > 0 ? (
          <div style={{ color: "#ffb86b", fontSize: 14 }}>
            Duplicate values: {duplicateValues.join(", ")}
          </div>
        ) : null}
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        {data.groups.map((group, groupIndex) => (
          <div key={group.id} style={{ background: "#151b2f", padding: 16, borderRadius: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={group.name}
                onChange={(event) => {
                  const value = event.target.value;
                  updateData((current) => {
                    current.groups[groupIndex].name = value;
                    return current;
                  });
                }}
                style={{ flex: 1, padding: 8 }}
              />
              <button
                onClick={() => {
                  updateData((current) => {
                    current.groups.splice(groupIndex, 1);
                    return current;
                  });
                  setSelectedGroupId((current) => (current === group.id ? "" : current));
                }}
              >
                Delete group
              </button>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {group.items.map((item, itemIndex) => {
                const normalized = normalizeValue(item.value);
                const duplicateCount = data.groups
                  .flatMap((entryGroup) => entryGroup.items)
                  .filter((entry) => normalizeValue(entry.value) === normalized).length;

                return (
                  <div key={item.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <select
                      value={item.type}
                      onChange={(event) => {
                        const value = event.target.value as RouteItemType;
                        updateData((current) => {
                          current.groups[groupIndex].items[itemIndex].type = value;
                          return current;
                        });
                      }}
                    >
                      <option value="domain">domain</option>
                      <option value="cidr">cidr</option>
                    </select>

                    <input
                      value={item.value}
                      onChange={(event) => {
                        const value = event.target.value;
                        updateData((current) => {
                          current.groups[groupIndex].items[itemIndex].value = value;
                          return current;
                        });
                      }}
                      style={{ flex: 1, padding: 8 }}
                    />

                    {duplicateCount > 1 ? (
                      <div style={{ color: "#ffb86b", alignSelf: "center", minWidth: 90 }}>duplicate</div>
                    ) : null}

                    <button
                      onClick={() => {
                        updateData((current) => {
                          current.groups[groupIndex].items.splice(itemIndex, 1);
                          return current;
                        });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}

              {group.items.length === 0 ? <div style={{ color: "#96a0bb" }}>Group is empty</div> : null}
            </div>
          </div>
        ))}
      </section>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save to GitHub"}
        </button>
        <button onClick={downloadPreview}>Download preview as file</button>
      </div>

      {message ? <div>{message}</div> : null}

      <textarea readOnly value={preview} style={{ minHeight: 320, width: "100%", padding: 12 }} />
    </div>
  );
}
