import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BabaWina — Taking a little break",
  description: "BabaWina is pausing for a short while. We'll be back with updates soon.",
  keywords: ["spot the ball", "south africa competition", "win prizes", "gaming competition", "online games", "win cars", "daily competitions", "babawina", "south african games", "prize competitions", "skill games", "win money"],
  authors: [{ name: "BabaWina" }],
  creator: "BabaWina",
  publisher: "BabaWina",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.babawina.co.za"),
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "/",
    title: "BabaWina — Taking a little break",
    description: "BabaWina is pausing for a short while. We'll be back with updates soon.",
    siteName: "BabaWina",
  },
  twitter: {
    card: "summary_large_image",
    title: "BabaWina — Taking a little break",
    description: "BabaWina is pausing for a short while. We'll be back with updates soon.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="msapplication-TileColor" content="#2563EB" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
