import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SliceAudio",
    description: "Slice your audio files into custom-sized segments",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <main className="min-h-screen selection:text-emerald-400 selection:bg-emerald-400/10 bg-emerald-400/5">
            {children}
        </main>
        </body>
        </html>
    );
}