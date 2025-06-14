import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { Suspense } from 'react'
import Providers from './providers'
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'Contravo - Sözleşme Yaşam Döngüsü Yönetimi',
  description: 'Kurumsal şirketler için Türkiye mevzuatına uygun Sözleşme Yaşam Döngüsü Yönetimi (CLM) platformu. Sözleşme otomasyonu, dijital imza ve sözleşme takibi çözümleri.',
  keywords: 'sözleşme yönetimi, CLM, hukuk teknolojileri, legal tech, sözleşme otomasyonu, dijital imza, sözleşme takibi, Türkiye mevzuatı',
  authors: [{ name: 'Contravo', url: 'https://contravo.com' }],
  creator: 'Contravo',
  publisher: 'Contravo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Contravo - Sözleşme Yaşam Döngüsü Yönetimi',
    description: 'Kurumsal şirketler için Türkiye mevzuatına uygun Sözleşme Yaşam Döngüsü Yönetimi (CLM) platformu.',
    url: 'https://contravo.com',
    siteName: 'Contravo',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contravo - Sözleşme Yaşam Döngüsü Yönetimi',
    description: 'Kurumsal şirketler için Türkiye mevzuatına uygun Sözleşme Yaşam Döngüsü Yönetimi (CLM) platformu.',
    creator: '@contravo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${inter.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Suspense fallback={<div>Yükleniyor...</div>}>
            <ThemeProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
            </ThemeProvider>
          </Suspense>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
} 