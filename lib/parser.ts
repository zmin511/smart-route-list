import { RoutesData, RouteGroup, RouteItem } from "./types";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function parseSmartRouteList(text: string): RoutesData {
  const lines = text.split(/\r?\n/);
  const groups: RouteGroup[] = [];
  const groupsByName = new Map<string, RouteGroup>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      const name = line.replace(/^#\s+/, "").trim();
      if (!name) continue;

      const legacyGroup: RouteGroup = {
        id: makeId(),
        name,
        items: []
      };

      groups.push(legacyGroup);
      groupsByName.set(name.toLowerCase(), legacyGroup);
      continue;
    }

    let value = line;
    let groupName = "";

    const separatorIndex = line.lastIndexOf("#");
    if (separatorIndex > 0) {
      value = line.slice(0, separatorIndex).trim();
      groupName = line.slice(separatorIndex + 1).trim();
    }

    if (!value) continue;

    const isCidr = /^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(value);

    const item: RouteItem = {
      id: makeId(),
      type: isCidr ? "cidr" : "domain",
      value
    };

    if (groupName) {
      const normalizedName = groupName.toLowerCase();
      let group = groupsByName.get(normalizedName);

      if (!group) {
        group = {
          id: makeId(),
          name: groupName,
          items: []
        };
        groups.push(group);
        groupsByName.set(normalizedName, group);
      }

      group.items.push(item);
      continue;
    }

    const fallbackGroupName = "Ungrouped";
    let fallbackGroup = groupsByName.get(fallbackGroupName.toLowerCase());

    if (!fallbackGroup) {
      fallbackGroup = {
        id: makeId(),
        name: fallbackGroupName,
        items: []
      };
      groups.push(fallbackGroup);
      groupsByName.set(fallbackGroupName.toLowerCase(), fallbackGroup);
    }

    fallbackGroup.items.push(item);
  }

  return { groups };
}
