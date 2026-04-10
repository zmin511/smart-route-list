export const metadata = {
  title: "Редактор Smart Route List",
  description: "Редактор smart-route-list для Vercel и GitHub"
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
