import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://experimental.software"),
  title: {
    default: "Experimental Software",
    template: "%s | Experimental Software",
  },
  description: "A software lab building tools, products, and internet experiments.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Experimental Software",
    description: "A software lab building tools, products, and internet experiments.",
    url: "/",
    siteName: "Experimental Software",
    images: [
      {
        url: "/social.png",
        width: 1731,
        height: 909,
        alt: "Experimental Software",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Experimental Software",
    description: "A software lab building tools, products, and internet experiments.",
    images: ["/social.png"],
  },
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
