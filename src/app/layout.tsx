import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Adapte Minha Prova',
  description: 'Adapte suas provas em PDF para alunos com necessidades especiais usando IA',
  keywords: ['educação', 'acessibilidade', 'prova', 'adaptação', 'inclusão', 'DI', 'TEA', 'TDAH', 'dislexia'],
  authors: [{ name: 'Adapte Minha Prova' }],
  openGraph: {
    title: 'Adapte Minha Prova',
    description: 'Adapte suas provas em PDF para alunos com necessidades especiais usando IA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
