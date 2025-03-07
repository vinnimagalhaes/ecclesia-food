import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/providers/auth-provider'
import { CarrinhoProvider } from '@/contexts/CarrinhoContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ecclesia Food',
  description: 'Sistema de gestão de eventos para igrejas',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-full m-0 p-0">
        <AuthProvider>
          <CarrinhoProvider>
            {children}
            <Toaster richColors position="top-right" />
          </CarrinhoProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 