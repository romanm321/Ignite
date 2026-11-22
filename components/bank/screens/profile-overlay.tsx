'use client'

import { CircleHelp } from 'lucide-react'
import { useBank } from '../bank-provider'
import { LinkRow } from '../nav'
import { OverlayFrame } from '../overlay'
import { FamilyUserToggle } from '../family/family-user-toggle'
import { AccountSetup } from '../setup/account-setup'
import { ProfileSettings } from './profile-screen'

/** The customer's profile and settings, opened from their photo on Home. */
export function ProfileOverlay() {
  const { customerType, setupDismissed, dispatch } = useBank()

  return (
    <OverlayFrame title="Profile & settings" onBack={() => dispatch({ type: 'overlay', overlay: null })}>
      <div className="px-4">
        <ul className="mb-6 overflow-hidden rounded-3xl bg-card">
          <LinkRow
            icon={CircleHelp}
            title="Help"
            body="Ask Tedi, book a banker or call us"
            onClick={() => {
              dispatch({ type: 'overlay', overlay: null })
              dispatch({ type: 'navigate', tab: 'more' })
            }}
          />
        </ul>
        <ProfileSettings
          identitySlot={<FamilyUserToggle />}
          midSlot={customerType === 'new' && setupDismissed ? <AccountSetup placement="profile" /> : null}
        />
      </div>
    </OverlayFrame>
  )
}
