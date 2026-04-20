import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

import { QueryProvider } from "@/components/providers/query-provider";
import { WorkspaceProvider } from "@/context/workspace-context";


export const metadata: Metadata = {
  title: "Sourcely AI | Developer Knowledge Base",
  description: "AI-powered developer wiki and chat assistant trained on your workspace data.",
  openGraph: {
    title: "Sourcely AI | Neural Knowledge Base",
    description: "Convert scattered company knowledge into an intelligent AI wiki.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sourcely AI Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sourcely AI",
    description: "AI-powered developer wiki and chat assistant.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          mono.variable
        )}
      >
        <QueryProvider>
          <WorkspaceProvider>
            {children}
          </WorkspaceProvider>
        </QueryProvider>

      </body>
    </html>
  );
}

