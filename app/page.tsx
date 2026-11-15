import { AppShell } from '@/components/bank/app-shell'
import { BankProvider } from '@/components/bank/bank-provider'
import { TrustProvider } from '@/components/bank/trust-provider'
import { FamilyProvider } from '@/components/bank/family/family-provider'

export default function Page() {
  return (
    <BankProvider>
      <TrustProvider>
        <FamilyProvider>
          <AppShell />
        </FamilyProvider>
      </TrustProvider>
    </BankProvider>
  )
}
