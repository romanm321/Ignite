export type HomeTileId = 'setup' | 'activity' | 'credit' | 'insights' | 'help'

export const defaultHomeOrder: HomeTileId[] = ['setup', 'activity', 'credit', 'insights', 'help']

export const homeTileLabels: Record<HomeTileId, string> = {
  setup: 'Account setup',
  activity: 'Recent activity',
  credit: 'Bills and credit score',
  insights: 'Insights',
  help: 'Talk to someone',
}

/** Swaps a tile with its visible neighbour, leaving tiles that are not shown to this customer where they were. */
export function moveTile(order: HomeTileId[], visible: HomeTileId[], id: HomeTileId, direction: -1 | 1): HomeTileId[] {
  const shown = order.filter((tile) => visible.includes(tile))
  const from = shown.indexOf(id)
  const to = from + direction
  if (from < 0 || to < 0 || to >= shown.length) return order
  ;[shown[from], shown[to]] = [shown[to], shown[from]]
  let next = 0
  return order.map((tile) => (visible.includes(tile) ? shown[next++] : tile))
}
