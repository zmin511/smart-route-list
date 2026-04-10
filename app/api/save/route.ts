import { generateSmartRouteList } from "@/lib/generator";
import { getRepoFile, updateRepoFile } from "@/lib/github";
import { RoutesData } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as RoutesData;
  const jsonPath = process.env.ROUTES_JSON_PATH || "routes.json";
  const txtPath = process.env.ROUTES_TXT_PATH || "smart-route-list.txt";

  const prettyJson = JSON.stringify(body, null, 2) + "\n";
  const smartTxt = generateSmartRouteList(body);

  let jsonSha: string | undefined;
  let txtSha: string | undefined;

  try {
    const file = await getRepoFile(jsonPath);
    jsonSha = file.sha;
  } catch {}

  try {
    const file = await getRepoFile(txtPath);
    txtSha = file.sha;
  } catch {}

  await updateRepoFile({
    path: jsonPath,
    content: prettyJson,
    message: "Update routes.json from admin panel",
    sha: jsonSha
  });

  await updateRepoFile({
    path: txtPath,
    content: smartTxt,
    message: "Update smart-route-list.txt from admin panel",
    sha: txtSha
  });

  return Response.json({ ok: true, preview: smartTxt });
}
