import type { Metadata } from "next";
import { Quicksand, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "TransitOps Workspace",
  description: "TransitOps POC - Odoo Hackathon 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quicksand.variable} ${fraunces.variable}`}
    >
      <body className={`min-h-screen bg-background font-sans antialiased`}>
        <a
          href="#main-content"
          className="fixed left-3 top-3 z-[2000] -translate-y-20 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition focus:translate-y-0"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
