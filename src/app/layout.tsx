import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BankOS — Banking Exam Operating System",
  description: "AI-powered banking exam preparation. Mission control, adaptive practice, mock tests, and real-time analytics.",
  icons: {
    icon: "/BOlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(11,17,32,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                backdropFilter: 'blur(20px)',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}