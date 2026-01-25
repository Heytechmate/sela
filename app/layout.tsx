import type { Metadata } from "next";
import "./globals.css"; // <--- THIS IS THE CRITICAL LINE

export const metadata: Metadata = {
  title: "Sela Cosmetics",
  description: "App Store Quality UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}