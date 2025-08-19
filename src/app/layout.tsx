import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import RightClickProtection from "./components/RightClickProtection";
import "./globals.css";
import { cn } from "./lib/utils";

// Suppress all console output in production
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  for (const method of ['log', 'warn', 'error', 'info', 'debug']) {
    // @ts-ignore
    console[method] = () => {};
  }
}



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medirate",
  description: "Healthcare rate developments and legislative updates",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body
        className={cn(
          "min-h-screen font-sans antialiased no-right-click",
          geistMono.variable
        )}
      >
        <RightClickProtection />
        <Navbar />
        {children}
      </body>
    </html>
  );
}