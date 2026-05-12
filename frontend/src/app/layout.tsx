import type { Metadata } from "next";
import { Alata } from "next/font/google";
import "../styles/globals.css";
import Navbar from "@/components/shared/navbar/navbar";

const alata = Alata({
  variable: "--font-alata",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "RazakEvent",
  description: "KTR event management web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${alata.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
