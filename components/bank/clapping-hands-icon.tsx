import type { SVGProps } from 'react'

/**
 * Two hands meeting in applause, with three bursts above them. Drawn to sit with the Lucide icons.
 * The hands are filled with `fill` (the colour of whatever they sit on) so the front hand hides the lines of the back one.
 */
export function ClappingHandsIcon({ fill = 'var(--lime)', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <g transform="rotate(30 7.5 23)" fill={fill}>
        <path d="M4 22.5V11.5a1.9 1.9 0 0 1 3.8 0V9a1.9 1.9 0 0 1 3.8 0V22.5" />
        <path d="M4 14.5H2.6a1.6 1.6 0 0 0 0 3.2H4" />
      </g>
      <g transform="rotate(-30 16.5 23)" fill={fill}>
        <path d="M12.4 22.5V9a1.9 1.9 0 0 1 3.8 0v2.5a1.9 1.9 0 0 1 3.8 0v11" />
        <path d="M20 14.5h1.4a1.6 1.6 0 0 1 0 3.2H20" />
      </g>
      <path d="M12 1.2v2.4" />
      <path d="M5.6 3.6l1.5 1.7" />
      <path d="M18.4 3.6l-1.5 1.7" />
    </svg>
  )
}
