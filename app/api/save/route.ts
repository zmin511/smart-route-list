import { generateSmartRouteList } from "@/lib/generator";
import { decodeBase64, getRepoFile, updateRepoFile } from "@/lib/github";
import { RoutesData } from "@/lib/types";

function createBackupPath(originalPath: string) {
  const backupDir = (process.env.BACKUP_DIR || "backups").replace(/\/+$/g, "");
  const safeTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = originalPath.split("/").pop() || "smart-route-list.txt";

  return `${backupDir}/${safeTimestamp}-${fileName}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as RoutesData;
  const jsonPath = process.env.ROUTES_JSON_PATH || "routes.json";
  const txtPath = process.env.ROUTES_TXT_PATH || "smart-route-list.txt";

  const prettyJson = JSON.stringify(body, null, 2) + "\n";
  const smartTxt = generateSmartRouteList(body);

  let jsonSha: string | undefined;
  let txtSha: string | undefined;
  let currentTxtContent: string | undefined;

  try {
    const file = await getRepoFile(jsonPath);
    jsonSha = file.sha;
  } catch {}

  try {
    const file = await getRepoFile(txtPath);
    txtSha = file.sha;
    currentTxtContent = decodeBase64(file.content);
  } catch {}

  if (currentTxtContent) {
    await updateRepoFile({
      path: createBackupPath(txtPath),
      content: currentTxtContent,
      message: "Create backup of smart-route-list.txt before admin update"
    });
  }

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
