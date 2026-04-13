import "./globals.css";

export const metadata = {
  title: "Редактор Smart Route List",
  description: "Редактор smart-route-list для Vercel и GitHub"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
