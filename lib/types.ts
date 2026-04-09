export type RouteItemType = "domain" | "cidr";

export interface RouteItem {
  id: string;
  type: RouteItemType;
  value: string;
}

export interface RouteGroup {
  id: string;
  name: string;
  items: RouteItem[];
}

export interface RoutesData {
  groups: RouteGroup[];
}
