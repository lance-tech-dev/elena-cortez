import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getProfile } from "@/lib/profile";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { name, role } = await getProfile();
  return {
    title: {
      default: role ? `${name} | ${role}` : name,
      template: `%s | ${name}`,
    },
    description:
      "Personal portfolio showcasing IT projects, technical skills, and professional experience.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // globals.css sets scroll-behavior: smooth (for #anchor links). Since
      // Next 16 that also animates the jump to the top on every navigation,
      // which looks like the page glitching. This attribute makes Next turn
      // smooth scrolling off while it changes routes.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
