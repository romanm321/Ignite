import {
  ArrowDownUp,
  BadgePercent,
  BookOpen,
  CalendarClock,
  Gift,
  Globe,
  GraduationCap,
  Headset,
  Home,
  LifeBuoy,
  LineChart,
  Plane,
  Sparkles,
  Split,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import type { PerkIcon as PerkIconId } from '@/lib/segments'

const icons: Record<PerkIconId, LucideIcon> = {
  safety: LifeBuoy,
  early: CalendarClock,
  credit: TrendingUp,
  split: Split,
  perks: Gift,
  globe: Globe,
  grad: GraduationCap,
  learn: BookOpen,
  boost: BadgePercent,
  rewards: Sparkles,
  concierge: Headset,
  sweep: ArrowDownUp,
  equity: LineChart,
  lounge: Plane,
  home: Home,
  debt: TrendingDown,
}

export function PerkIcon({ icon, className }: { icon: PerkIconId; className?: string }) {
  const Icon = icons[icon]
  return <Icon className={className} aria-hidden />
}
