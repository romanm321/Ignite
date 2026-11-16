import type { useBank } from '../bank-provider'

type Dispatch = ReturnType<typeof useBank>['dispatch']

/** Opens the Plan tab on its Vaults page. */
export function openVaultsSection(dispatch: Dispatch) {
  dispatch({ type: 'growSection', section: 'vaults' })
  dispatch({ type: 'navigate', tab: 'grow' })
  // Hidden tab scrollers ignore scrollTop, so wait for the Plan screen to become visible.
  requestAnimationFrame(() => {
    document.querySelectorAll<HTMLElement>('[data-tab-screen="grow"] .overflow-y-auto').forEach((el) => el.scrollTo({ top: 0 }))
  })
}
