import type { Metadata } from "next";
import "./globals.css";
import { Inter } from 'next/font/google';
import ThemeProvider from "@/components/ThemeProvider";
import QueryProvider from '@/components/QueryProvider';
import AuthProvider from '@/components/AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Layout } from 'lucide-react';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'TaskFlow - Personal Task Management System',
  description: 'Organize your tasks and projects efficiently with TaskFlow',
  verification: {
    google: 'IS_ltGSttjxtOmfTl89veubmRVaFePs0A4r6Tm2gjAA',
  },
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HSR6C3E6TE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HSR6C3E6TE');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <ToastContainer 
                position="top-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
              {/* Footer */}
              <footer className="border-t">
                <div className="container flex flex-col md:flex-row h-16 p-2 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    <span className="text-sm font-semibold">TaskFlow</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    © 2024 TaskFlow. All rights reserved. 
                  </p>
                </div>
              </footer>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
