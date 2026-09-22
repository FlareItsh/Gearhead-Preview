import Header from '@/components/Header'
import { Toaster } from '@/components/ui/sonner'
import { type ReactNode } from 'react'

interface GuestLayoutProps {
  children: ReactNode
}

export default function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
