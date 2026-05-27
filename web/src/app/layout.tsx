import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { AppShell } from "@/components/layout/app-shell"
import { AiDrawer } from "@/features/ai/ai-drawer";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Collabrix",
  description: "Realtime AI-powered collaboration platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* AppShell is the container that holds your Sidebar and Navbar */}
          {/* {children} is whatever page you are currently viewing (Dashboard, Board, etc.) */}
          <AppShell>{children}</AppShell>
          {/* 2. This sits ready to slide over top of the page */}
          <AiDrawer />
        </ThemeProvider>
      </body>
    </html>
  )
}