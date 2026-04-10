import { decodeBase64, getRepoFile } from "@/lib/github";
import { parseSmartRouteList } from "@/lib/parser";

export async function GET() {
  const jsonPath = process.env.ROUTES_JSON_PATH || "routes.json";
  const txtPath = process.env.ROUTES_TXT_PATH || "smart-route-list.txt";
  let txtError = "";

  try {
    const txtFile = await getRepoFile(txtPath);
    const txt = decodeBase64(txtFile.content);
    return Response.json({ data: parseSmartRouteList(txt) });
  } catch (error) {
    txtError = error instanceof Error ? error.message : "Unknown smart-route-list.txt error";
  }

  try {
    const file = await getRepoFile(jsonPath);
    const json = JSON.parse(decodeBase64(file.content));
    return Response.json({ data: json });
  } catch (error) {
    const jsonError = error instanceof Error ? error.message : "Unknown routes.json error";
    return Response.json(
      {
        error: `Не удалось загрузить данные из GitHub. smart-route-list.txt: ${txtError}. routes.json: ${jsonError}.`
      },
      { status: 500 }
    );
  }
}
