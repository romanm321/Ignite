import { cn } from '@/lib/utils'

/** A headline amount in a light weight, with the cents set smaller: $184.20 */
export function BigAmount({ value, className }: { value: string; className?: string }) {
  const match = value.match(/^(.*?)(\.\d{2})$/)
  return (
    <span className={cn('tabular font-light leading-none tracking-tight', className)}>
      {match ? match[1] : value}
      {match && <span className="text-[0.55em]">{match[2]}</span>}
    </span>
  )
}
