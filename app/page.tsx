import { AppShell } from '@/components/bank/app-shell'
import { BankProvider } from '@/components/bank/bank-provider'
import { CapgoUpdater } from '@/components/bank/capgo-updater'
import { TrustProvider } from '@/components/bank/trust-provider'
import { FamilyProvider } from '@/components/bank/family/family-provider'

export default function Page() {
  return (
    <BankProvider>
      <TrustProvider>
        <FamilyProvider>
          <CapgoUpdater />
          <div className="flex min-h-dvh justify-center">
            <AppShell />
          </div>
        </FamilyProvider>
      </TrustProvider>
    </BankProvider>
  )
}
