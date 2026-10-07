import type { Metadata, Viewport } from "next";
import { Cinzel, Hanken_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";

// Downloaded at build time and served by the app itself: no requests to Google at runtime.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cinzel" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-hanken" });

export const metadata: Metadata = {
  title: { default: "Ludexis", template: "%s · Ludexis" },
  description: "Catalog, enrich and preserve your game archive.",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  openGraph: { title: "Ludexis", description: "Catalog, enrich and preserve your game archive.", images: ["/brand/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#09080d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${cinzel.variable} ${hanken.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-stone focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-parchment"
        >
          Skip to content
        </a>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: "!bg-stone !border-seam !text-parchment !font-sans",
              description: "!text-ash",
              error: "!border-ember/50",
              success: "!border-moss/40",
            },
          }}
        />
      </body>
    </html>
  );
}
