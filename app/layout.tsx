import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ollertonhub.co.uk"),
  title: {
    default: "Ollerton Hub",
    template: "%s | Ollerton Hub",
  },
  description:
    "Find local businesses, services, community information and useful places around Ollerton.",

  openGraph: {
    title: "Ollerton Hub",
    description:
      "Find local businesses, services, community information and useful places around Ollerton.",
    url: "https://www.ollertonhub.co.uk",
    siteName: "Ollerton Hub",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Ollerton Hub local business and community directory",
      },
    ],
    locale: "en_GB",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Ollerton Hub",
    description:
      "Find local businesses, services, community information and useful places around Ollerton.",
    images: ["/opengraph-image.png"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}