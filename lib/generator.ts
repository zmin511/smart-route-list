import { RoutesData } from "./types";

export function generateSmartRouteList(data: RoutesData): string {
  const lines: string[] = [];

  for (const group of data.groups) {
    const groupName = group.name.trim();
    if (!groupName) continue;

    lines.push(`# ${groupName}`);

    for (const item of group.items) {
      const value = item.value.trim();
      if (value) lines.push(value);
    }

    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}
