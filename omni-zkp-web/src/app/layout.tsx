import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Omni-ZKP | Zero-Knowledge Identity",
    description:
        "Privacy-preserving identity and proof platform. Prove humanity, location, and email attestation with Halo2 ZK-SNARKs — without revealing any personal data.",
    openGraph: {
        title: "Omni-ZKP | Zero-Knowledge Identity",
        description: "Halo2 ZK proofs compiled to WASM. Shamir's Secret Sharing. W3C Verifiable Credentials.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full dark">
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}
            >
                {children}
                <Analytics />
            </body>
        </html>
    );
}
