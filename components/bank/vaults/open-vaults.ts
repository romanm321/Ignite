import type { useBank } from '../bank-provider'

type Dispatch = ReturnType<typeof useBank>['dispatch']

/** Opens Insights on its Vaults view. */
export function openVaultsSection(dispatch: Dispatch) {
  dispatch({ type: 'openInsights', tab: 'vaults' })
  // Hidden tab scrollers ignore scrollTop, so wait for the Plan screen to become visible.
  requestAnimationFrame(() => {
    document.querySelectorAll<HTMLElement>('[data-tab-screen="grow"] .overflow-y-auto').forEach((el) => el.scrollTo({ top: 0 }))
  })
}

/** Opens the Vaults landing page, where a new Regular or Savings Vault is set up. */
export function openVaultsLanding(dispatch: Dispatch) {
  dispatch({ type: 'overlay', overlay: 'vaults' })
}
