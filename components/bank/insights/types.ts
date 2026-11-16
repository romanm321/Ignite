export const insightsTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'spending', label: 'Spending' },
  { id: 'bills', label: 'Bills' },
] as const

export type InsightsTab = (typeof insightsTabs)[number]['id']
