'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/calendar')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center gradient-prof">
      <div className="animate-pulse">
        <img src="/logo.svg" alt="ПРОФ" className="h-14 brightness-0 invert" />
      </div>
    </div>
  )
}
