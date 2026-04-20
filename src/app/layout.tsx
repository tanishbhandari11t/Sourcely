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

