import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import RouteEditor from "@/components/route-editor";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1>Smart Route Admin</h1>
      <p>Редактирование групп, доменов и CIDR для smart-route-list.txt.</p>
      <RouteEditor />
    </main>
  );
}
