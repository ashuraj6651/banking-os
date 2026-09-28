'use client'

import { useEffect, useState } from 'react'
import { useBankOS } from '@/lib/store'
import { useAuth } from '@/lib/hooks'
import { Aurora } from '@/components/bankos/Aurora'
import { Landing } from '@/components/bankos/landing/Landing'
import { Auth } from '@/components/bankos/Auth'
import { Onboarding } from '@/components/bankos/Onboarding'
import { AppShell } from '@/components/bankos/AppShell'
import { Wordmark } from '@/components/bankos/Primitives'

export default function Home() {
  const { stage } = useBankOS()
  const { data: authData, isLoading: authLoading } = useAuth()
  const account = authData?.account
  const hasProfile = authData?.hasProfile

  // Has the very first auth check for this page load finished? We only
  // care about this once — after that, stage transitions are driven purely
  // by the effect below and normal user navigation.
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (account && hasProfile) {
      useBankOS.getState().setStage('app')
    } else if (account && !hasProfile) {
      useBankOS.getState().setStage('onboarding')
    } else if (!account) {
      // Stay on landing or auth
    }
    setResolved(true)
  }, [account, hasProfile, authLoading])

  // While the initial auth check is still in flight, show a neutral splash
  // instead of the landing page. Without this, every reload (including the
  // moment right after signing in) briefly rendered the landing page before
  // snapping to the dashboard, because `stage` always starts as "landing".
  const showSplash = !resolved && stage === 'landing'

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Aurora />
      {showSplash ? (
        <SplashScreen />
      ) : (
        <>
          {stage === 'landing' && <Landing />}
          {stage === 'auth' && <Auth />}
          {stage === 'onboarding' && <Onboarding />}
          {stage === 'app' && <AppShell />}
        </>
      )}
    </div>
  )
}

function SplashScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6">
      <Wordmark size="lg" />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[splash-bar_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-violet-400 to-electric-400" />
      </div>
    </div>
  )
}