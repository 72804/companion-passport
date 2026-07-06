import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { BillingProvider } from "@/context/BillingContext";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Companion Passport — Your AI Companion Identity",
  description:
    "Create a personalized AI companion that remembers your style, routines, and boundaries. Build your Companion Passport and prepare for a future robot upgrade.",
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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <AuthProvider>
          <AppProvider>
            <BillingProvider>
              <AppShell>{children}</AppShell>
            </BillingProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
