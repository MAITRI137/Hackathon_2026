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
    <html lang="en" suppressHydrationWarning className={`${quicksand.variable} ${fraunces.variable}`}>
      <body
        className={`min-h-screen bg-background font-sans antialiased`}
      >
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
