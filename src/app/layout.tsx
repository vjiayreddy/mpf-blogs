import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ApolloProvider } from "@/components/providers/apollo-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Blog Portal",
    template: "%s · Blog Portal",
  },
  description: "A Ghost-like publishing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${sourceSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-[family-name:var(--font-dm-sans)]">
        <AuthProvider>
          <ApolloProvider>{children}</ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
