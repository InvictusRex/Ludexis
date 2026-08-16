import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { AppWrapper } from "@/components/layout/app-wrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ludexis - Game Archive Platform",
  description:
    "A self-hosted game metadata archive and catalog platform. Organize, discover, and manage your game collection with intelligent tagging and metadata management.",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-background text-foreground"
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <AuthProvider>
          <AppWrapper>{children}</AppWrapper>
        </AuthProvider>

        <Toaster richColors position="bottom-right" />

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
