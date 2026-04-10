import { decodeBase64, getRepoFile } from "@/lib/github";
import { parseSmartRouteList } from "@/lib/parser";

export async function GET() {
  const jsonPath = process.env.ROUTES_JSON_PATH || "routes.json";
  const txtPath = process.env.ROUTES_TXT_PATH || "smart-route-list.txt";

  try {
    const file = await getRepoFile(jsonPath);
    const json = JSON.parse(decodeBase64(file.content));
    return Response.json({ data: json });
  } catch {
    const txtFile = await getRepoFile(txtPath);
    const txt = decodeBase64(txtFile.content);
    return Response.json({ data: parseSmartRouteList(txt) });
  }
}
