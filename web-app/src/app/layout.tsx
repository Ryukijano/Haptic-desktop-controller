import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haptic Desktop Controller",
  description: "Control your desktop using everyday objects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
