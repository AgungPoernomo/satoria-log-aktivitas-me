import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Log Aktivitas",
  description: "Sistem pencatatan log aktivitas harian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}