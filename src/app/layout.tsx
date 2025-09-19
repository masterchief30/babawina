import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BabaWina - Win Big with Spot-the-Ball",
  description: "Play Spot-the-Ball. Get closest to the ball's true position and win the prize. Proudly South African.",
  keywords: ["spot the ball", "competition", "south africa", "win prizes", "game"],
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
    title: "BabaWina - Win Big with Spot-the-Ball",
    description: "Play Spot-the-Ball. Get closest to the ball's true position and win the prize. Proudly South African.",
    siteName: "BabaWina",
  },
  twitter: {
    card: "summary_large_image",
    title: "BabaWina - Win Big with Spot-the-Ball",
    description: "Play Spot-the-Ball. Get closest to the ball's true position and win the prize. Proudly South African.",
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
        <meta name="theme-color" content="#FFD700" />
        <meta name="msapplication-TileColor" content="#FFD700" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
