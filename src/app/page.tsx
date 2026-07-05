'use client'

import { useEffect } from 'react'
import { useBankOS } from '@/lib/store'
import { useAuth } from '@/lib/hooks'
import { Aurora } from '@/components/bankos/Aurora'
import { Landing } from '@/components/bankos/landing/Landing'
import { Auth } from '@/components/bankos/Auth'
import { Onboarding } from '@/components/bankos/Onboarding'
import { AppShell } from '@/components/bankos/AppShell'

export default function Home() {
  const { stage } = useBankOS()
  const { data: authData, isLoading: authLoading } = useAuth()
  const account = authData?.account
  const hasProfile = authData?.hasProfile

  useEffect(() => {
    if (authLoading) return
    if (account && hasProfile) {
      useBankOS.getState().setStage('app')
    } else if (account && !hasProfile) {
      useBankOS.getState().setStage('onboarding')
    } else if (!account) {
      // Stay on landing or auth
    }
  }, [account, hasProfile, authLoading])

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Aurora />
      {stage === 'landing' && <Landing />}
      {stage === 'auth' && <Auth />}
      {stage === 'onboarding' && <Onboarding />}
      {stage === 'app' && <AppShell />}
    </div>
  )
}