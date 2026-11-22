'use client'

import { ChevronRight } from 'lucide-react'
import { formatMoney } from '@/lib/bank-data'
import type { ProductId } from '@/lib/offers'
import { useBank } from '../bank-provider'
import { ScreenHeader } from '../primitives'
import { HeaderActions } from '../nav'
import { useInvestPicture } from '../invest/use-invest'
import { INVEST_ACCOUNT_ID } from '../invest/use-invest-account'
import { useSavingsHome } from '../vaults/use-savings-home'
import { ProductTile, PromoTile, TileRail, type ProductImage } from '../products/product-tiles'

type Promo = { key: string; tag: string; headline: string; line: string; image: ProductImage; open: () => void }
type Tile = { key: string; name: string; line: string; image: ProductImage; yours?: boolean; open: () => void }

/** Products, kept simple: offers picked for you first, then Saving, Investing and Borrowing to swipe through. */
export function ProductsScreen() {
  const { accounts, owned, customerType, streetSafe, dispatch } = useBank()
  const savings = useSavingsHome()
  const { invest, readyToInvest } = useInvestPicture()

  const card = accounts.find((a) => a.kind === 'credit')
  const cd = accounts.find((a) => a.id === 'cd' || a.id === 'step-cd')
  const whole = (n: number) => (streetSafe ? '••••' : formatMoney(n).replace(/\.\d\d$/, ''))

  const openProduct = (id: ProductId, accountId?: string) => () =>
    accountId ? dispatch({ type: 'openAccount', id: accountId }) : dispatch({ type: 'startOnboarding', productId: id, skipIntro: true })
  const askBanker = (topic: string) => () => dispatch({ type: 'askTedi', prompt: `Book a banker to talk about a ${topic}` })
  const openInvesting = () =>
    invest.opened ? dispatch({ type: 'openAccount', id: INVEST_ACCOUNT_ID }) : dispatch({ type: 'overlay', overlay: 'invest' })

  const savingsId = savings.account?.id
  const completeOwned = owned.includes('complete')
  const autoOwned = owned.includes('auto-invest')

  const allPromos: Record<string, Promo | null> = {
    investing: invest.opened
      ? null
      : {
          key: 'investing',
          tag: 'Ready now',
          headline: `${whole(readyToInvest)} to grow`,
          line: 'Invest with $0 fees.',
          image: 'direct-investing',
         
          open: openInvesting,
        },
    complete: completeOwned
      ? null
      : { key: 'complete', tag: 'Special offer', headline: '$750 bonus', line: 'Bring in $10,000 to Complete.', image: 'complete', open: openProduct('complete') },
    cd: cd ? null : { key: 'cd', tag: 'Limited time', headline: '4.25% for a year', line: 'Lock in your rate.', image: 'step-cd', open: openProduct('step-cd') },
    growth: savingsId
      ? null
      : { key: 'growth', tag: 'Welcome offer', headline: '4.60% interest', line: 'Open it in a minute.', image: 'growth-savings', open: openProduct('growth-savings') },
    card: card
      ? null
      : { key: 'card', tag: 'Pre-approved', headline: '2% back on everything', line: 'Plus a $200 bonus.', image: 'double-up', open: openProduct('double-up') },
    auto: autoOwned
      ? null
      : { key: 'auto', tag: 'Easy start', headline: 'Invest from $5', line: 'We build it for you.', image: 'auto-invest', open: openProduct('auto-invest') },
  }
  const promoOrder = customerType === 'new' ? ['growth', 'card', 'auto'] : ['investing', 'complete', 'cd']
  const promos = promoOrder.map((k) => allPromos[k]).filter((p): p is Promo => Boolean(p))

  const saving: Tile[] = [
    { key: 'growth', name: 'Growth Savings', line: 'Watch it grow', image: 'growth-savings', yours: Boolean(savingsId), open: openProduct('growth-savings', savingsId) },
    { key: 'cd', name: 'Step Rate CD', line: 'Lock in a great rate', image: 'step-cd', yours: Boolean(cd), open: openProduct('step-cd', cd?.id) },
    { key: 'complete', name: 'Complete', line: 'Your cash works harder', image: 'complete', yours: completeOwned, open: openProduct('complete', completeOwned ? 'complete' : undefined) },
    { key: 'student', name: 'Student Banking', line: 'Free while you study', image: 'student', yours: owned.includes('student'), open: openProduct('student', owned.includes('student') ? 'student' : undefined) },
    { key: 'family', name: 'TD Family', line: 'Money skills for teens', image: 'family', open: () => dispatch({ type: 'overlay', overlay: 'family' }) },
  ]
  const investing: Tile[] = [
    { key: 'direct', name: 'Direct Investing', line: 'Start with just $1', image: 'direct-investing', yours: invest.opened, open: openInvesting },
    { key: 'auto', name: 'Auto Invest', line: 'We invest for you', image: 'auto-invest', yours: autoOwned, open: openProduct('auto-invest', autoOwned ? 'auto-invest' : undefined) },
  ]
  const borrowing: Tile[] = [
    { key: 'card', name: 'Double Up Card', line: '2% back on everything', image: 'double-up', yours: Boolean(card), open: openProduct('double-up', card?.id) },
    { key: 'home', name: 'Home Loan', line: 'Find your place', image: 'home-loan', open: askBanker('home loan') },
    { key: 'auto-loan', name: 'Auto Loan', line: 'Drive away happy', image: 'auto-loan', open: askBanker('car loan') },
  ]

  const section = (id: string, title: string, tiles: Tile[]) => (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="px-1 font-heading text-2xl font-bold">
        {title}
      </h2>
      <TileRail label={title}>
        {tiles.map((t) => (
          <ProductTile key={t.key} name={t.name} line={t.line} image={t.image} yours={t.yours} onOpen={t.open} />
        ))}
      </TileRail>
    </section>
  )

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Products" right={<HeaderActions />} />

      <div className="flex flex-col gap-8 px-4 pt-3">
        {promos.length > 0 && (
          <section aria-labelledby="products-for-you" className="flex flex-col gap-3">
            <h2 id="products-for-you" className="px-1 font-heading text-2xl font-bold">
              Just for you
            </h2>
            <TileRail label="Offers for you" wide>
              {promos.map((p) => (
                <PromoTile key={p.key} tag={p.tag} headline={p.headline} line={p.line} image={p.image} onOpen={p.open} />
              ))}
            </TileRail>
          </section>
        )}

        {section('products-saving', 'Saving', saving)}
        {section('products-investing', 'Investing', investing)}
        {section('products-borrowing', 'Borrowing', borrowing)}

        <button
          type="button"
          onClick={() => dispatch({ type: 'overlay', overlay: 'explore' })}
          className="flex h-12 items-center justify-center gap-1 rounded-xl border-2 border-forest text-sm font-semibold text-forest outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary active:bg-muted"
        >
          Compare accounts <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
