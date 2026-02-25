import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ПРОФ — Календарь мероприятий',
  description: 'Централизованное планирование мероприятий университетской профсоюзной платформы',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="font-raleway antialiased">{children}</body>
    </html>
  )
}
