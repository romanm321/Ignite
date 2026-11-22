'use client'

import { StoryReel, type StorySlide } from '../onboarding/product-story'
import { StoryArt } from '../onboarding/story-art'
import { useBank } from '../bank-provider'

const slides: StorySlide[] = [
  {
    id: 'goals',
    title: 'Save for what matters',
    body: 'A Vault is a savings goal with its own name, picture and progress bar.',
    visual: <StoryArt name="goals" />,
  },
  {
    id: 'types',
    title: 'Two kinds of Vault',
    body: 'Regular Vaults set money aside from checking. Savings Vaults earn up to 4.60% inside Growth Savings.',
    visual: <StoryArt name="savings" />,
  },
  {
    id: 'tiers',
    title: 'The more you save, the more you earn',
    body: 'Reach $10,000 across your Savings Vaults for +0.10%, and $50,000 for +0.25% on every one.',
    visual: <StoryArt name="achievement" />,
  },
  {
    id: 'autopilot',
    title: 'Save on autopilot',
    body: 'Round-ups save your spare change, and scheduled deposits move money into your Vaults every week, two weeks or month.',
    visual: <StoryArt name="card-tap" />,
  },
  {
    id: 'bills',
    title: 'Pay bills from a Vault',
    body: 'Set a bill aside in its own Vault and pay it from there when it is due.',
    visual: <StoryArt name="calendar" />,
  },
  {
    id: 'access',
    title: 'Access on your terms',
    body: 'Instant Access lets you withdraw any time. Select Access pays more, with 2 withdrawals a year. Lock a Vault to stay on track.',
    visual: <StoryArt name="security" />,
  },
  {
    id: 'closer',
    title: 'Create your first Vault',
    body: 'It takes under a minute, and you can change the name and goal later.',
    visual: <StoryArt name="celebrate" />,
  },
]

/** The first-time introduction to Vaults, shown before a customer sets up their first one. */
export function VaultsStory() {
  const { vaultsStory, dispatch } = useBank()
  if (!vaultsStory) return null
  const replay = vaultsStory === 'replay'

  return (
    <div role="dialog" aria-modal="true" aria-label="How Vaults work" className="absolute inset-0 z-[60] flex flex-col bg-black animate-in fade-in slide-in-from-bottom-6">
      <StoryReel
        title="Vaults"
        slides={slides}
        startLabel={replay ? 'Got it' : 'Create a Vault'}
        dismissLabel={replay ? null : 'Not now'}
        onStart={() => dispatch({ type: 'vaultsStoryEnd', proceed: !replay })}
        onClose={() => dispatch({ type: 'vaultsStoryEnd', proceed: false })}
      />
    </div>
  )
}
