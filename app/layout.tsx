import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Prompt Please — UGC Video Deconstructor",
  description:
    "Upload any UGC video and instantly extract a high-fidelity AI generation prompt for Sora, Kling, or Runway.",
  metadataBase: new URL("https://promptplease.app"),
  openGraph: {
    title: "Prompt Please — UGC Video Deconstructor",
    description:
      "Upload any UGC video and instantly extract a high-fidelity AI generation prompt for Sora, Kling, or Runway.",
    type: "website",
    url: "https://promptplease.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Please — UGC Video Deconstructor",
    description:
      "Upload any UGC video and instantly extract a high-fidelity AI generation prompt for Sora, Kling, or Runway.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider afterSignOutUrl="/sign-in">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
