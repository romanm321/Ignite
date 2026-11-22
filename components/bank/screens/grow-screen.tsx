'use client'

import { InsightsPage } from '../insights/insights-page'
import { ScreenHeader } from '../primitives'
import { HeaderActions } from '../nav'

export function GrowScreen() {
  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto pb-8">
      <ScreenHeader title="Insights" subtitle="Your money, all in one place" right={<HeaderActions />} />
      <div className="px-4 pt-2">
        <InsightsPage />
      </div>
    </div>
  )
}
