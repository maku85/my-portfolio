import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Lato, Raleway } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";

import "../globals.css";
import { routing } from "@/i18n/routing";

import Footer from "@/components/Footer";
import MotionContainer from "@/components/MotionContainer";
import Navbar from "@/components/Navbar";

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: "400",
});
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export const metadata: Metadata = {
  title: "Mauro Cunsolo",
  description:
    "My personal portfolio website. I'm a software engineer specializing in web development, passionate about creating efficient and scalable applications.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-6xl mx-auto md:px-4 w-full flex-1">{children}</div>
);

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body
        className={`${lato.variable} ${raleway.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider>
          <Navbar />
          <Container>
            <MotionContainer>{children}</MotionContainer>
          </Container>
          <Footer />
        </NextIntlClientProvider>

        <Analytics />
      </body>
    </html>
  );
}
