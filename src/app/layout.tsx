import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Experimental Software Studio",
  description: "A VS Code-inspired editable landing page built as a web workspace.",
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
