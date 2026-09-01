import type { Metadata, Viewport } from "next";
import {
  Noto_Sans_Arabic,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { LocaleHydrator } from "@/components/i18n/LocaleProvider";
import { getThemeInitScript } from "@/lib/theme/storage";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoGujarati = Noto_Sans_Gujarati({
  variable: "--font-noto-gujarati",
  subsets: ["gujarati"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Loaded for RTL scripts (Arabic / Urdu / Persian) and native-name rendering. */
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title:
    "StudentLife AI — AI Tutor, Assignments, Exams, Streaks and Student Budget",
  description:
    "StudentLife AI helps students ask questions, complete assignments, generate tests, manage deadlines, build study streaks, and control their student budget.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${notoDevanagari.variable} ${notoGujarati.variable} ${notoArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider initialTheme="SYSTEM" initialPersonality="PROFESSIONAL">
          <LocaleHydrator />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
