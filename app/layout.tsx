import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";

// Load premium fonts
const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const lato = Lato({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
  display: "swap",
});

// --- 1. PROFESSIONAL METADATA ---
export const metadata: Metadata = {
  metadataBase: new URL('https://selacosmetics.com'), // Replace with your actual Vercel URL
  title: {
    default: "Sela Cosmetics | Luxury Skincare & Beauty",
    template: "%s | Sela Cosmetics"
  },
  description: "Discover science-backed formulations for the modern minimalist. Shop premium skincare, perfumes, and beauty essentials in Sri Lanka.",
  keywords: ["skincare", "beauty", "cosmetics", "sri lanka", "luxury perfume", "sela cosmetics"],
  authors: [{ name: "Sela Cosmetics" }],
  openGraph: {
    title: "Sela Cosmetics | The New Standard of Beauty",
    description: "Redefining skincare with science-backed formulations. Shop the exclusive collection.",
    url: 'https://selacosmetics.com',
    siteName: 'Sela Cosmetics',
    images: [
      {
        url: '/og-image.jpg', // You should add a 1200x630px image to your public folder named 'og-image.jpg'
        width: 1200,
        height: 630,
        alt: 'Sela Cosmetics Collection',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Sela Cosmetics | Luxury Beauty",
    description: "Science-backed formulations for the modern minimalist.",
    images: ['/og-image.jpg'], // Same image as above
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: 'black',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} scroll-smooth`}>
      <body className="antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}