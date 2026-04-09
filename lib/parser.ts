import { RoutesData, RouteGroup, RouteItem } from "./types";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function parseSmartRouteList(text: string): RoutesData {
  const lines = text.split(/\r?\n/);
  const groups: RouteGroup[] = [];
  let current: RouteGroup | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      current = {
        id: makeId(),
        name: line.replace(/^#\s+/, "").trim(),
        items: []
      };
      groups.push(current);
      continue;
    }

    if (!current) continue;

    const isCidr = /^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(line);

    const item: RouteItem = {
      id: makeId(),
      type: isCidr ? "cidr" : "domain",
      value: line
    };

    current.items.push(item);
  }

  return { groups };
}
