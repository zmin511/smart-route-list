export const metadata = {
  title: "Smart Route List Admin",
  description: "Редактор smart-route-list для Vercel + GitHub"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#0b1020",
          color: "#ffffff"
        }}
      >
        {children}
      </body>
    </html>
  );
}
