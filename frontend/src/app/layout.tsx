import type { Metadata } from "next";
import { Alata, Space_Mono } from "next/font/google";
import "../styles/globals.css";

const alata = Alata({
  variable: "--font-alata",
  weight: "400",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RazakEvent — KTR Event Management",
  description: "KTR event management web app for Kolej Tun Razak, UTM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${alata.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
