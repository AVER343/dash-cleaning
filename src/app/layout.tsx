import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Home Cleaning Admin",
  description: "Admin dashboard for booking appointments"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
