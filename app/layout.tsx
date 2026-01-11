import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haptic Desktop Controller",
  description: "Gesture-based desktop control with Gemini Robotics-ER 1.5",
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
