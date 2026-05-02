import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PropertyCRM - Real Estate Lead Management",
  description: "Professional CRM system for property dealers in Pakistan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a35",
                color: "#e2e8f0",
                border: "1px solid rgba(99,102,241,0.3)",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#1a1a35" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#1a1a35" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
