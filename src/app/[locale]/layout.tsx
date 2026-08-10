import type { Metadata } from "next";
import { Lato, Raleway } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import "../globals.css";

import Footer from "@/components/Footer";
import MotionContainer from "@/components/MotionContainer";
import { socials } from "@/data/socials";
import { routing } from "@/i18n/routing";

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-lato",
  weight: "400",
});
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

const SITE_URL = "https://maurocunsolo.xyz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.site" });

  const localePath = locale === routing.defaultLocale ? "" : `/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: `%s | Mauro Cunsolo`,
    },
    description: t("description"),
    alternates: {
      canonical: localePath || "/",
      languages: Object.fromEntries(
        routing.locales.map((loc: string) => [
          loc,
          loc === routing.defaultLocale ? "/" : `/${loc}`,
        ]),
      ),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: localePath || "/",
      siteName: "Mauro Cunsolo",
      locale,
      type: "website",
      images: [{ url: "/banner.webp", width: 1424, height: 752 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/banner.webp"],
    },
    icons: {
      icon: [
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", type: "image/x-icon" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    verification: {
      other: {
        "msvalidate.01": "F34D7F66818840D88DF443A4D8CF0E91",
      },
    },
  };
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mauro Cunsolo",
  url: SITE_URL,
  jobTitle: "Backend Developer",
  sameAs: socials.map((social) => social.url),
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
        <Script
          id="person-jsonld"
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <NextIntlClientProvider>
          <Container>
            <MotionContainer>{children}</MotionContainer>
          </Container>
          <Footer />
        </NextIntlClientProvider>

        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_BEACON_TOKEN}"}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
